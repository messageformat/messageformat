import Formatters from 'messageformat-formatters';
import { parse } from 'messageformat-parser';
import { identifier, property } from 'safe-identifier';
import { biDiMarkText } from './bidi-mark-text';

function getFormatter(options, key) {
  const fn = options.customFormatters[key] || Formatters[key];
  if (!fn) throw new Error(`Formatting function not found: ${key}`);
  return fn;
}

/** @private */
export default class Compiler {
  /** Creates a new message compiler. Called internally from {@link MessageFormat#compile}.
   *
   * @private
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
   * @private
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
        fn = property('fmt', token.key);
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

  addNumberFormatter({ key, param }, args, plural) {
    const lc = JSON.stringify(this.lc);
    if (!param) {
      // {var, number} can use runtime number()
      args.unshift(lc);
      args.push('0');
      return 'number';
    }

    args.push(lc);
    const fmtArg0 = param.tokens[0];
    if (param.tokens.length === 1 && typeof fmtArg0 === 'string') {
      // Use arg-specific formatters for common cases
      switch (fmtArg0.trim()) {
        case 'currency':
          args.push(JSON.stringify(this.options.currency));
          this.formatters.numberCurrency = getFormatter(
            this.options,
            'numberCurrency'
          );
          return 'fmt.numberCurrency';

        case 'integer':
          this.formatters.numberInteger = getFormatter(
            this.options,
            'numberInteger'
          );
          return 'fmt.numberInteger';

        case 'percent':
          this.formatters.numberPercent = getFormatter(
            this.options,
            'numberPercent'
          );
          return 'fmt.numberPercent';
      }

      const cm = fmtArg0.match(/^\s*currency:([A-Z]+)\s*$/);
      if (cm) {
        args.push(JSON.stringify(cm[1]));
        this.formatters.numberCurrency = getFormatter(
          this.options,
          'numberCurrency'
        );
        return 'fmt.numberCurrency';
      }
    }

    if (plural && this.options.strictNumberSign) plural = null;
    const s = param.tokens.map(tok => this.token(tok, plural));
    args.push('(' + (s.join(' + ') || '""') + ').trim()');
    args.push(JSON.stringify(this.options.currency));
    this.formatters.numberFmt = getFormatter(this.options, 'numberFmt');
    return 'fmt.numberFmt';
  }
}
