import {
  getFormatter,
  getFormatterSource
} from 'messageformat-number-skeleton';
import { parse } from 'messageformat-parser';
import * as Runtime from 'messageformat-runtime';
import * as Formatters from 'messageformat-runtime/lib/formatters';
import { identifier, property } from 'safe-identifier';
import { biDiMarkText } from './bidi-mark-text';

const RUNTIME_MODULE = 'messageformat-runtime';
const CARDINAL_MODULE = 'messageformat-runtime/lib/cardinals';
const PLURAL_MODULE = 'messageformat-runtime/lib/plurals';
const FORMATTER_MODULE = 'messageformat-runtime/lib/formatters';

export default class Compiler {
  /** Creates a new message compiler. Called internally from {@link MessageFormat#compile}.
   *
   * @param {object} options - A MessageFormat options object
   * @property {object} locales - The locale identifiers that are used by the compiled functions
   * @property {object} runtime - Names of the core runtime functions that are used by the compiled functions
   * @property {object} formatters - The formatter functions that are used by the compiled functions
   */
  constructor(options) {
    this.options = options;
    this.plural = null;
    this.runtime = {};
  }

  /** Recursively compile a string or a tree of strings to JavaScript function sources
   *
   *  If `src` is an object with a key that is also present in `plurals`, the key
   *  in question will be used as the locale identifier for its value. To disable
   *  the compile-time checks for plural & selectordinal keys while maintaining
   *  multi-locale support, use falsy values in `plurals`.
   *
   * @param {string|object} src - the source for which the JS code should be generated
   * @param {object} plural - the default locale
   * @param {object} plurals - a map of pluralization keys for all available locales
   */
  compile(src, plural, plurals) {
    if (typeof src === 'object') {
      const result = {};
      for (const key of Object.keys(src)) {
        const pl = plurals[key] || plural;
        result[key] = this.compile(src[key], pl, plurals);
      }
      return result;
    }

    this.plural = plural;
    const parserOptions = {
      cardinal: plural.cardinals,
      ordinal: plural.ordinals,
      strict: this.options.strictNumberSign
    };
    this.arguments = [];
    const r = parse(src, parserOptions).map(token => this.token(token));
    let reqArgs = '';
    if (this.options.requireAllArguments && this.arguments.length > 0) {
      this.setRuntimeFn('reqArgs');
      reqArgs = `reqArgs(${JSON.stringify(this.arguments)}, d); `;
    }
    return `function(d) { ${reqArgs}return ${this.concatenate(r, true)}; }`;
  }

  cases(token, pluralToken) {
    let needOther = true;
    const r = token.cases.map(({ key, tokens }) => {
      if (key === 'other') needOther = false;
      const s = tokens.map(tok => this.token(tok, pluralToken));
      return `${property(null, key)}: ${this.concatenate(s, false)}`;
    });
    if (needOther) {
      const { type } = token;
      const { cardinals, ordinals } = this.plural;
      if (
        type === 'select' ||
        (type === 'plural' && cardinals.includes('other')) ||
        (type === 'selectordinal' && ordinals.includes('other'))
      )
        throw new Error(`No 'other' form found in ${JSON.stringify(token)}`);
    }
    return `{ ${r.join(', ')} }`;
  }

  concatenate(tokens, root) {
    const asValues = this.options.returnType === 'values';
    return asValues && (root || tokens.length > 1)
      ? '[' + tokens.join(', ') + ']'
      : tokens.join(' + ') || '""';
  }

  token(token, pluralToken) {
    if (typeof token == 'string') return JSON.stringify(token);

    let fn;
    this.arguments.push(token.arg);
    let args = [property('d', token.arg)];
    switch (token.type) {
      case 'argument':
        return this.options.biDiSupport
          ? biDiMarkText(args[0], this.plural.id)
          : args[0];

      case 'select':
        fn = 'select';
        if (pluralToken && this.options.strictNumberSign) pluralToken = null;
        args.push(this.cases(token, pluralToken));
        this.setRuntimeFn('select');
        break;

      case 'selectordinal':
        fn = 'plural';
        args.push(
          token.offset || 0,
          identifier(this.plural.id),
          this.cases(token, token),
          1
        );
        this.setLocale(this.plural.id, true);
        this.setRuntimeFn('plural');
        break;

      case 'plural':
        fn = 'plural';
        args.push(
          token.offset || 0,
          identifier(this.plural.id),
          this.cases(token, token)
        );
        this.setLocale(this.plural.id, false);
        this.setRuntimeFn('plural');
        break;

      case 'function':
        if (token.key === 'number') {
          fn = this.setNumberFormatter(token, args, pluralToken);
          break;
        }
        args.push(JSON.stringify(this.plural.locale));
        if (token.param) {
          if (pluralToken && this.options.strictNumberSign) pluralToken = null;
          const s = token.param.tokens.map(tok => this.token(tok, pluralToken));
          args.push('(' + (s.join(' + ') || '""') + ').trim()');
          if (token.key === 'number')
            args.push(JSON.stringify(this.options.currency));
        }
        fn = token.key;
        this.setFormatter(fn);
        break;

      case 'octothorpe':
        if (!pluralToken) return '"#"';
        args = [
          JSON.stringify(this.plural.locale),
          property('d', pluralToken.arg),
          pluralToken.offset || '0'
        ];
        if (this.options.strictNumberSign) {
          fn = 'strictNumber';
          args.push(JSON.stringify(pluralToken.arg));
        } else {
          fn = 'number';
        }
        this.setRuntimeFn(fn);
        break;
    }

    if (!fn) throw new Error('Parser error for token ' + JSON.stringify(token));
    return `${fn}(${args.join(', ')})`;
  }

  runtimeIncludes(key, type) {
    const prev = this.runtime[key];
    if (!prev || prev.type === type) return prev;
    if (identifier(key) !== key)
      throw new SyntaxError(`Reserved word used as ${type} identifier: ${key}`);
    throw new TypeError(
      `Cannot override ${prev.type} runtime function as ${type}: ${key}`
    );
  }

  setLocale(key, ord) {
    const prev = this.runtimeIncludes(key, 'locale');
    const { getCardinal, getPlural, isDefault } = this.plural;
    let pf;
    if (!ord && isDefault && getCardinal) {
      if (prev) return;
      pf = n => getCardinal(n);
      pf.module = CARDINAL_MODULE;
      pf.toString = () => String(getCardinal);
    } else {
      // overwrite a previous cardinal-only locale function
      if (prev && (!isDefault || prev.module === PLURAL_MODULE)) return;
      pf = (n, ord) => getPlural(n, ord);
      pf.module = isDefault ? PLURAL_MODULE : getPlural.module;
      pf.toString = () => String(getPlural);
    }
    pf.type = 'locale';
    this.runtime[key] = pf;
  }

  setRuntimeFn(key) {
    if (this.runtimeIncludes(key, 'runtime')) return;
    const rf = Runtime[key];
    rf.module = RUNTIME_MODULE;
    rf.type = 'runtime';
    this.runtime[key] = rf;
  }

  setFormatter(key) {
    if (this.runtimeIncludes(key, 'formatter')) return;
    const cf = this.options.customFormatters[key];
    if (cf) {
      cf.type = 'formatter';
      this.runtime[key] = cf;
    } else {
      const df = Formatters[key];
      if (df) {
        df.module = FORMATTER_MODULE;
        df.type = 'formatter';
        this.runtime[key] = df;
      } else {
        throw new Error(`Formatting function not found: ${key}`);
      }
    }
  }

  setNumberFormatter({ param }, args, plural) {
    const { locale } = this.plural;

    if (!param) {
      // {var, number} can use runtime number(lc, var, offset)
      args.unshift(JSON.stringify(locale));
      args.push('0');
      this.setRuntimeFn('number');
      return 'number';
    }

    args.push(JSON.stringify(locale));
    if (param.tokens.length === 1 && typeof param.tokens[0] === 'string') {
      const fmtArg = param.tokens[0].trim();

      switch (fmtArg) {
        case 'currency':
          args.push(JSON.stringify(this.options.currency));
          this.setFormatter('numberCurrency');
          return 'numberCurrency';
        case 'integer':
          this.setFormatter('numberInteger');
          return 'numberInteger';
        case 'percent':
          this.setFormatter('numberPercent');
          return 'numberPercent';
      }

      // TODO: Deprecate
      const cm = fmtArg.match(/^currency:([A-Z]+)$/);
      if (cm) {
        args.push(JSON.stringify(cm[1]));
        this.setFormatter('numberCurrency');
        return 'numberCurrency';
      }

      const key = identifier(fmtArg, true);
      if (!this.runtimeIncludes(key, 'formatter')) {
        const { currency } = this.options;
        const fmt = getFormatter(locale, fmtArg, currency);
        fmt.toString = () => getFormatterSource(locale, fmtArg, currency);
        fmt.type = 'formatter';
        this.runtime[key] = fmt;
      }
      return key;
    }

    if (plural && this.options.strictNumberSign) plural = null;
    const s = param.tokens.map(tok => this.token(tok, plural));
    args.push('(' + (s.join(' + ') || '""') + ').trim()');
    args.push(JSON.stringify(this.options.currency));
    this.setFormatter('numberFmt');
    return 'numberFmt';
  }
}
