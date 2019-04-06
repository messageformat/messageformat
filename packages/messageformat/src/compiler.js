import { parse } from 'messageformat-parser';
import { bidiMarkText, funcname, propname } from './utils';

/** @private */
export default class Compiler {
  /** Creates a new message compiler. Called internally from {@link MessageFormat#compile}.
   *
   * @private
   * @param {MessageFormat} mf - A MessageFormat instance
   * @property {object} locales - The locale identifiers that are used by the compiled functions
   * @property {object} runtime - Names of the core runtime functions that are used by the compiled functions
   * @property {object} formatters - The formatter functions that are used by the compiled functions
   */
  constructor(mf) {
    this.mf = mf;
    this.lc = null;
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
   * @param {string} lc - the default locale
   * @param {object} plurals - a map of pluralization keys for all available locales
   */
  compile(src, lc, plurals) {
    if (typeof src != 'object') {
      this.lc = lc;
      const pc = plurals[lc] || { cardinal: [], ordinal: [] };
      pc.strict = !!this.mf.strictNumberSign;
      const r = parse(src, pc).map(token => this.token(token));
      return `function(d) { return ${r.join(' + ') || '""'}; }`;
    } else {
      const result = {};
      for (var key in src) {
        var lcKey = plurals.hasOwnProperty(key) ? key : lc;
        result[key] = this.compile(src[key], lcKey, plurals);
      }
      return result;
    }
  }

  /** @private */
  cases(token, plural) {
    let needOther = token.type === 'select' || !this.mf.hasCustomPluralFuncs;
    const r = token.cases.map(({ key, tokens }) => {
      if (key === 'other') needOther = false;
      const s = tokens.map(tok => this.token(tok, plural));
      return propname(key) + ': ' + (s.join(' + ') || '""');
    });
    if (needOther)
      throw new Error("No 'other' form found in " + JSON.stringify(token));
    return `{ ${r.join(', ')} }`;
  }

  /** @private */
  token(token, plural) {
    if (typeof token == 'string') return JSON.stringify(token);

    let fn;
    let args = [propname(token.arg, 'd')];
    switch (token.type) {
      case 'argument':
        return this.mf.bidiSupport ? bidiMarkText(args[0], this.lc) : args[0];

      case 'select':
        fn = 'select';
        if (plural && this.mf.strictNumberSign) plural = null;
        args.push(this.cases(token, plural));
        this.runtime.select = true;
        break;

      case 'selectordinal':
        fn = 'plural';
        args.push(0, funcname(this.lc), this.cases(token, token), 1);
        this.locales[this.lc] = true;
        this.runtime.plural = true;
        break;

      case 'plural':
        fn = 'plural';
        args.push(
          token.offset || 0,
          funcname(this.lc),
          this.cases(token, token)
        );
        this.locales[this.lc] = true;
        this.runtime.plural = true;
        break;

      case 'function':
        if (
          !(token.key in this.mf.fmt) &&
          token.key in this.mf.constructor.formatters
        ) {
          const fmt = this.mf.constructor.formatters[token.key];
          this.mf.fmt[token.key] = fmt(this.mf);
        }
        if (!this.mf.fmt[token.key])
          throw new Error(
            `Formatting function ${JSON.stringify(token.key)} not found!`
          );
        args.push(JSON.stringify(this.lc));
        if (token.param) {
          if (plural && this.mf.strictNumberSign) plural = null;
          const s = token.param.tokens.map(tok => this.token(tok, plural));
          args.push('(' + (s.join(' + ') || '""') + ').trim()');
        }
        fn = propname(token.key, 'fmt');
        this.formatters[token.key] = true;
        break;

      case 'octothorpe':
        if (!plural) return '"#"';
        fn = 'number';
        args = [propname(plural.arg, 'd'), JSON.stringify(plural.arg)];
        if (plural.offset) args.push(plural.offset);
        this.runtime.number = true;
        break;
    }

    if (!fn) throw new Error('Parser error for token ' + JSON.stringify(token));
    return `${fn}(${args.join(', ')})`;
  }
}
