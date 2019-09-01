import { parse } from 'messageformat-parser';
import * as Formatters from 'messageformat-runtime/lib/formatters';
import { identifier, property } from 'safe-identifier';
import { biDiMarkText } from './bidi-mark-text';

function getFormatter(options, key) {
  const cf = options.customFormatters[key];
  if (cf) return cf;
  const df = Formatters[key];
  if (df) {
    df.module = 'messageformat-runtime/lib/formatters';
    return df;
  }
  throw new Error(`Formatting function not found: ${key}`);
}

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
    this.lc = null;
    this.locale = null;
    this.parserOptions = null;

    this.locales = {};
    this.runtime = {};
    this.formatters = {};
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

    this.lc = plural.id;
    this.locale = plural.locale;
    this.parserOptions = {
      cardinal: plural.cardinals,
      ordinal: plural.ordinals,
      strict: this.options.strictNumberSign
    };
    const r = parse(src, this.parserOptions).map(token => this.token(token));
    for (const fmt of Object.keys(this.formatters)) {
      const errType =
        plurals && plurals[fmt]
          ? 'plural identifiers'
          : this.runtime[fmt]
          ? 'runtime functions'
          : identifier(fmt) !== fmt
          ? 'JavaScript'
          : null;
      if (errType)
        throw new TypeError(`Formatter name is reserved (${errType}): ${fmt}`);
    }
    return `function(d) { return ${this.concatenate(r, true)}; }`;
  }

  /** @private */
  cases(token, plural) {
    let needOther = true;
    const r = token.cases.map(({ key, tokens }) => {
      if (key === 'other') needOther = false;
      const s = tokens.map(tok => this.token(tok, plural));
      return `${property(null, key)}: ${this.concatenate(s, false)}`;
    });
    if (needOther) {
      const { type } = token;
      const { cardinal, ordinal } = this.parserOptions;
      if (
        type === 'select' ||
        (type === 'plural' && cardinal.includes('other')) ||
        (type === 'selectordinal' && ordinal.includes('other'))
      )
        throw new Error(`No 'other' form found in ${JSON.stringify(token)}`);
    }
    return `{ ${r.join(', ')} }`;
  }

  /** @private */
  concatenate(tokens, root) {
    const asValues = this.options.returnType === 'values';
    return asValues && (root || tokens.length > 1)
      ? '[' + tokens.join(', ') + ']'
      : tokens.join(' + ') || '""';
  }

  /** @private */
  token(token, plural) {
    if (typeof token == 'string') return JSON.stringify(token);

    let fn;
    let args = [property('d', token.arg)];
    switch (token.type) {
      case 'argument':
        return this.options.biDiSupport
          ? biDiMarkText(args[0], this.lc)
          : args[0];

      case 'select':
        fn = 'select';
        if (plural && this.options.strictNumberSign) plural = null;
        args.push(this.cases(token, plural));
        this.runtime.select = true;
        break;

      case 'selectordinal':
        fn = 'plural';
        args.push(0, identifier(this.lc), this.cases(token, token), 1);
        this.locales[this.lc] = true;
        this.runtime.plural = true;
        break;

      case 'plural':
        fn = 'plural';
        args.push(
          token.offset || 0,
          identifier(this.lc),
          this.cases(token, token)
        );
        this.locales[this.lc] = true;
        this.runtime.plural = true;
        break;

      case 'function':
        if (token.key === 'number') {
          fn = this.addNumberFormatter(token, args, plural);
          break;
        }
        args.push(JSON.stringify(this.lc));
        if (token.param) {
          if (plural && this.options.strictNumberSign) plural = null;
          const s = token.param.tokens.map(tok => this.token(tok, plural));
          args.push('(' + (s.join(' + ') || '""') + ').trim()');
          if (token.key === 'number')
            args.push(JSON.stringify(this.options.currency));
        }
        fn = token.key;
        this.formatters[token.key] = getFormatter(this.options, token.key);
        break;

      case 'octothorpe':
        if (!plural) return '"#"';
        args = [
          JSON.stringify(this.locale),
          property('d', plural.arg),
          plural.offset || '0'
        ];
        if (this.options.strictNumberSign) {
          fn = 'strictNumber';
          args.push(JSON.stringify(plural.arg));
        } else {
          fn = 'number';
        }
        this.runtime[fn] = true;
        break;
    }

    if (!fn) throw new Error('Parser error for token ' + JSON.stringify(token));
    return `${fn}(${args.join(', ')})`;
  }

  /** @private */
  addNumberFormatter({ param }, args, plural) {
    const lc = JSON.stringify(this.lc);
    if (!param) {
      // {var, number} can use runtime number(lc, var, offset)
      args.unshift(lc);
      args.push('0');
      return 'number';
    }

    args.push(lc);
    const fmtArg0 = param.tokens[0];
    if (param.tokens.length === 1 && typeof fmtArg0 === 'string') {
      // Use arg-specific formatters for common cases
      let fn;
      switch (fmtArg0.trim()) {
        case 'currency':
          args.push(JSON.stringify(this.options.currency));
          fn = 'numberCurrency';
          break;
        case 'integer':
          fn = 'numberInteger';
          break;
        case 'percent':
          fn = 'numberPercent';
          break;
        default: {
          const cm = fmtArg0.match(/^\s*currency:([A-Z]+)\s*$/);
          if (cm) {
            args.push(JSON.stringify(cm[1]));
            fn = 'numberCurrency';
          }
        }
      }
      if (fn) {
        this.formatters[fn] = getFormatter(this.options, fn);
        return fn;
      }
    }

    if (plural && this.options.strictNumberSign) plural = null;
    const s = param.tokens.map(tok => this.token(tok, plural));
    args.push('(' + (s.join(' + ') || '""') + ').trim()');
    args.push(JSON.stringify(this.options.currency));
    this.formatters.numberFmt = getFormatter(this.options, 'numberFmt');
    return 'numberFmt';
  }
}
