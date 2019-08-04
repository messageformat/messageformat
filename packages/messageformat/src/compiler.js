import { parse } from 'messageformat-parser';
import { biDiMarkText, funcname, propname } from './utils';

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
    this.strict = !!mf.options.strictNumberSign;

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
      pc.strict = this.strict;
      const r = parse(src, pc).map(token => this.token(token));
      return `function(d) { return ${this.concatenate(r, true)}; }`;
    } else {
      const result = {};
      for (var key in src) {
        var lcKey = key in plurals ? key : lc;
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
      return `${propname(key)}: ${this.concatenate(s, false)}`;
    });
    if (needOther)
      throw new Error("No 'other' form found in " + JSON.stringify(token));
    return `{ ${r.join(', ')} }`;
  }

  /** @private */
  concatenate(tokens, root) {
    const asValues = this.mf.options.returnType === 'values';
    return asValues && (root || tokens.length > 1)
      ? '[' + tokens.join(', ') + ']'
      : tokens.join(' + ') || '""';
  }

  /** @private */
  token(token, plural) {
    if (typeof token == 'string') return JSON.stringify(token);

    let fn;
    let args = [propname(token.arg, 'd')];
    switch (token.type) {
      case 'argument':
        return this.mf.options.biDiSupport
          ? biDiMarkText(args[0], this.lc)
          : args[0];

      case 'select':
        fn = 'select';
        if (plural && this.strict) plural = null;
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
        args.push(JSON.stringify(this.lc));
        if (token.param) {
          if (plural && this.strict) plural = null;
          const s = token.param.tokens.map(tok => this.token(tok, plural));
          args.push('(' + (s.join(' + ') || '""') + ').trim()');
        }
        fn = propname(token.key, 'fmt');
        this.formatters[token.key] = this.mf.getFormatter(token.key);
        break;

      case 'octothorpe':
        if (!plural) return '"#"';
        args = [
          JSON.stringify(this.lc),
          propname(plural.arg, 'd'),
          plural.offset || '0'
        ];
        if (this.strict) {
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
}
