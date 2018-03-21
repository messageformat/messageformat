/** @file messageformat.js - ICU PluralFormat + SelectFormat for JavaScript
 *
 * @author Alex Sexton - @SlexAxton, Eemeli Aro - @eemeli_aro
 * @copyright 2012-2016 Alex Sexton, Eemeli Aro, and Contributors
 * @license To use or fork, MIT. To contribute back, JS Foundation CLA
 */

var Compiler = require('./compiler');
var formatters = require('./formatters');
var Runtime = require('./runtime');


/** Utility getter/wrapper for pluralization functions from
 *  {@link http://github.com/eemeli/make-plural.js make-plural}
 *
 * @private
 */
function getPluralFunc(locale, noPluralKeyChecks) {
  var plurals = require('make-plural/umd/plurals');
  var pluralCategories = require('make-plural/umd/pluralCategories');
  for (var l = locale; l; l = l.replace(/[-_]?[^-_]*$/, '')) {
    var pf = plurals[l];
    if (pf) {
      var pc = noPluralKeyChecks ? { cardinal: [], ordinal: [] } : (pluralCategories[l] || {});
      var fn = function() { return pf.apply(this, arguments); };
      fn.toString = function() { return pf.toString(); };
      fn.cardinal = pc.cardinal;
      fn.ordinal = pc.ordinal;
      return fn;
    }
  }
  throw new Error('Localisation function not found for locale ' + JSON.stringify(locale));
}


/** Create a new message formatter
 *
 *  If `locale` is not set, calls to `compile()` will fetch the default locale
 *  each time. A string `locale` will create a single-locale MessageFormat
 *  instance, with pluralisation rules fetched from the Unicode CLDR using
 *  {@link http://github.com/eemeli/make-plural.js make-plural}.
 *
 *  Using an array of strings as `locale` will create a MessageFormat object
 *  with multi-language support, with pluralisation rules fetched as above. To
 *  select which to use, use the second parameter of `compile()`, or use message
 *  keys corresponding to your locales.
 *
 *  Using an object `locale` with all properties of type `function` allows for
 *  the use of custom/externally defined pluralisation rules.
 *
 * @class
 * @param {string|string[]|Object.<string,function>} [locale] - The locale(s) to use
 */
function MessageFormat(locale) {
  this.pluralFuncs = {};
  if (locale) {
    if (typeof locale == 'string') {
      this.pluralFuncs[locale] = getPluralFunc(locale);
    } else if (Array.isArray(locale)) {
      locale.forEach(function(lc) { this.pluralFuncs[lc] = getPluralFunc(lc); }, this);
    } else if (typeof locale == 'object') {
      for (var lc in locale) if (locale.hasOwnProperty(lc)) {
        if (typeof locale[lc] != 'function') throw new Error('Expected function value for locale ' + JSON.stringify(lc));
        this.pluralFuncs[lc] = locale[lc];
      }
      this.hasCustomPluralFuncs = true;
    }
  }
  this.fmt = {};
  this.runtime = new Runtime(this);
}


/** The default locale
 *
 *  Read by `compile()` when no locale has been previously set
 *
 * @memberof MessageFormat
 * @default 'en'
 */
MessageFormat.defaultLocale = 'en';


/** Escape special characaters
 *
 *  Surround the characters `{` and `}` in the input string with 'quotes'.
 *  This will allow those characters to not be considered as MessageFormat
 *  control characters.
 *
 * @param {string} str - The input string
 * @param {boolean} [octothorpe=false] - Include `#` in the escaped characters
 * @returns {string} The escaped string
 */
MessageFormat.escape = function(str, octothorpe) {
  const esc = octothorpe ? '[#{}]' : '[{}]';
  return str.replace(new RegExp(esc, 'g'), "'$&'");
}


MessageFormat.formatters = formatters;

/** Add custom formatter functions to this MessageFormat instance
 *
 * The general syntax for calling a formatting function in MessageFormat is
 * `{var, fn[, arg]}`, where `var` is the variable that will be set by the
 * user code, `fn` determines the formatting function, and `arg` is an
 * optional string argument.
 *
 * In JavaScript, each formatting function is called with three parameters;
 * the variable value `v`, the current locale `lc`, and `arg` as a string, or
 * undefined if not set. `arg` will be trimmed of surrounding whitespace.
 * Formatting functions should not have side effects.
 *
 * @see Formatters
 *
 * @memberof MessageFormat
 * @param {Object.<string,function>} fmt - A map of formatting functions
 * @returns {MessageFormat} The MessageFormat instance, to allow for chaining
 *
 * @example
 * var mf = new MessageFormat('en-GB');
 * mf.addFormatters({
 *   upcase: function(v) { return v.toUpperCase(); },
 *   locale: function(v, lc) { return lc; },
 *   prop: function(v, lc, p) { return v[p] }
 * });
 *
 * mf.compile('This is {VAR, upcase}.')({ VAR: 'big' })
 * // 'This is BIG.'
 *
 * mf.compile('The current locale is {_, locale}.')({ _: '' })
 * // 'The current locale is en-GB.'
 *
 * mf.compile('Answer: {obj, prop, a}')({ obj: {q: 3, a: 42} })
 * // 'Answer: 42'
 */
MessageFormat.prototype.addFormatters = function(fmt) {
  for (var name in fmt) if (fmt.hasOwnProperty(name)) {
    this.fmt[name] = fmt[name];
  }
  return this;
};


/** Disable the validation of plural & selectordinal keys
 *
 *  Previous versions of messageformat.js allowed the use of plural &
 *  selectordinal statements with any keys; now we throw an error when a
 *  statement uses a non-numerical key that will never be matched as a
 *  pluralization category for the current locale.
 *
 *  Use this method to disable the validation and allow usage as previously.
 *  To re-enable, you'll need to create a new MessageFormat instance.
 *
 * @returns {MessageFormat} The MessageFormat instance, to allow for chaining
 *
 * @example
 * var mf = new MessageFormat('en');
 * var msg = '{X, plural, zero{no answers} one{an answer} other{# answers}}';
 *
 * mf.compile(msg);
 * // Error: Invalid key `zero` for argument `X`. Valid plural keys for this
 * //        locale are `one`, `other`, and explicit keys like `=0`.
 *
 * mf.disablePluralKeyChecks();
 * mf.compile(msg)({ X: 0 });
 * // '0 answers'
 */
MessageFormat.prototype.disablePluralKeyChecks = function() {
  this.noPluralKeyChecks = true;
  for (var lc in this.pluralFuncs) if (this.pluralFuncs.hasOwnProperty(lc)) {
    this.pluralFuncs[lc].cardinal = [];
    this.pluralFuncs[lc].ordinal = [];
  }
  return this;
};


/** Enable or disable the addition of Unicode control characters to all input
 *  to preserve the integrity of the output when mixing LTR and RTL text.
 *
 * @see http://cldr.unicode.org/development/development-process/design-proposals/bidi-handling-of-structured-text
 *
 * @memberof MessageFormat
 * @param {boolean} [enable=true]
 * @returns {MessageFormat} The MessageFormat instance, to allow for chaining
 *
 * @example
 * // upper case stands for RTL characters, output is shown as rendered
 * var mf = new MessageFormat('en');
 *
 * mf.compile('{0} >> {1} >> {2}')(['first', 'SECOND', 'THIRD']);
 * // 'first >> THIRD << SECOND'
 *
 * mf.setBiDiSupport(true);
 * mf.compile('{0} >> {1} >> {2}')(['first', 'SECOND', 'THIRD']);
 * // 'first >> SECOND >> THIRD'
 */
MessageFormat.prototype.setBiDiSupport = function(enable) {
    this.bidiSupport = !!enable || (typeof enable == 'undefined');
    return this;
};


/** According to the ICU MessageFormat spec, a `#` character directly inside a
 *  `plural` or `selectordinal` statement should be replaced by the number
 *  matching the surrounding statement. By default, messageformat.js will
 *  replace `#` signs with the value of the nearest surrounding `plural` or
 *  `selectordinal` statement.
 *
 *  Set this to true to follow the stricter ICU MessageFormat spec, and to
 *  throw a runtime error if `#` is used with non-numeric input.
 *
 * @memberof MessageFormat
 * @param {boolean} [enable=true]
 * @returns {MessageFormat} The MessageFormat instance, to allow for chaining
 *
 * @example
 * var mf = new MessageFormat('en');
 *
 * var cookieMsg = '#: {X, plural, =0{no cookies} one{a cookie} other{# cookies}}';
 * mf.compile(cookieMsg)({ X: 3 });
 * // '#: 3 cookies'
 *
 * var pastryMsg = '{X, plural, one{{P, select, cookie{a cookie} other{a pie}}} other{{P, select, cookie{# cookies} other{# pies}}}}';
 * mf.compile(pastryMsg)({ X: 3, P: 'pie' });
 * // '3 pies'
 *
 * mf.setStrictNumberSign(true);
 * mf.compile(pastryMsg)({ X: 3, P: 'pie' });
 * // '# pies'
 */
MessageFormat.prototype.setStrictNumberSign = function(enable) {
    this.strictNumberSign = !!enable || (typeof enable == 'undefined');
    this.runtime.setStrictNumber(this.strictNumberSign);
    return this;
};


/** Compile messages into storable functions
 *
 *  If `messages` is a single string including ICU MessageFormat declarations,
 *  the result of `compile()` is a function taking a single Object parameter
 *  `d` representing each of the input's defined variables.
 *
 *  If `messages` is a hierarchical structure of such strings, the output of
 *  `compile()` will match that structure, with each string replaced by its
 *  corresponding JavaScript function.
 *
 *  If the input `messages` -- and therefore the output -- of `compile()` is an
 *  object, the output object will have a `toString(global)` method that may be
 *  used to store or cache the compiled functions to disk, for later inclusion
 *  in any JS environment, without a local MessageFormat instance required. Its
 *  `global` parameters sets the name (if any) of the resulting global variable,
 *  with special handling for `export default`. If `global` does not contain a
 *  `.`, the output defaults to an UMD pattern.
 *
 *  If `locale` is not set, the first locale set in the object's constructor
 *  will be used by default; using a key at any depth of `messages` that is a
 *  declared locale will set its child elements to use that locale.
 *
 *  If `locale` is set, it is used for all messages. If the constructor
 *  declared any locales, `locale` needs to be one of them.
 *
 * @memberof MessageFormat
 * @param {string|Object} messages - The input message(s) to be compiled, in ICU MessageFormat
 * @param {string} [locale] - A locale to use for the messages
 * @returns {function|Object} The first match found for the given locale(s)
 *
 * @example
 * var mf = new MessageFormat('en');
 * var cf = mf.compile('A {TYPE} example.');
 *
 * cf({ TYPE: 'simple' })
 * // 'A simple example.'
 *
 * @example
 * var mf = new MessageFormat(['en', 'fi']);
 * var cf = mf.compile({
 *   en: { a: 'A {TYPE} example.',
 *         b: 'This is the {COUNT, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} example.' },
 *   fi: { a: '{TYPE} esimerkki.',
 *         b: 'Tämä on {COUNT, selectordinal, other{#.}} esimerkki.' }
 * });
 *
 * cf.en.b({ COUNT: 2 })
 * // 'This is the 2nd example.'
 *
 * cf.fi.b({ COUNT: 2 })
 * // 'Tämä on 2. esimerkki.'
 *
 * @example
 * var fs = require('fs');
 * var mf = new MessageFormat('en');
 * var msgSet = {
 *   a: 'A {TYPE} example.',
 *   b: 'This has {COUNT, plural, one{one member} other{# members}}.',
 *   c: 'We have {P, number, percent} code coverage.'
 * };
 * var cfStr = mf.compile(msgSet).toString('module.exports');
 * fs.writeFileSync('messages.js', cfStr);
 * ...
 * var messages = require('./messages');
 *
 * messages.a({ TYPE: 'more complex' })
 * // 'A more complex example.'
 *
 * messages.b({ COUNT: 3 })
 * // 'This has 3 members.'
 */
MessageFormat.prototype.compile = function(messages, locale) {
  function _stringify(obj, level) {
    if (!level) level = 0;
    if (typeof obj != 'object') return obj;
    var o = [], indent = '';
    for (var i = 0; i < level; ++i) indent += '  ';
    for (var k in obj) o.push('\n' + indent + '  ' + Compiler.propname(k) + ': ' + _stringify(obj[k], level + 1));
    return '{' + o.join(',') + '\n' + indent + '}';
  }

  var pf;
  if (Object.keys(this.pluralFuncs).length == 0) {
    if (!locale) locale = MessageFormat.defaultLocale;
    pf = {};
    pf[locale] = getPluralFunc(locale, this.noPluralKeyChecks);
  } else if (locale) {
    pf = {};
    pf[locale] = this.pluralFuncs[locale];
    if (!pf[locale]) throw new Error('Locale ' + JSON.stringify(locale) + 'not found in ' + JSON.stringify(this.pluralFuncs) + '!');
  } else {
    pf = this.pluralFuncs;
    locale = Object.keys(pf)[0];
  }

  var compiler = new Compiler(this);
  var obj = compiler.compile(messages, locale, pf);

  if (typeof messages != 'object') {
    var fn = new Function(
        'number, plural, select, fmt', Compiler.funcname(locale),
        'return ' + obj);
    var rt = this.runtime;
    return fn(rt.number, rt.plural, rt.select, this.fmt, pf[locale]);
  }

  var rtStr = this.runtime.toString(pf, compiler) + '\n';
  var objStr = _stringify(obj);
  var result = new Function(rtStr + 'return ' + objStr)();
  if (result.hasOwnProperty('toString')) throw new Error('The top-level message key `toString` is reserved');

  result.toString = function(global) {
    switch (global || '') {
      case 'export default':
        return rtStr +  'export default ' + objStr;
      case '':
        return rtStr + 'return ' + objStr;
      default:
        if (global.indexOf('.') > -1) return rtStr + global + ' = ' + objStr;
        return rtStr + [
          '(function (root, G) {',
          '  if (typeof define === "function" && define.amd) { define(G); }',
          '  else if (typeof exports === "object") { module.exports = G; }',
          '  else { ' + Compiler.propname(global, 'root') + ' = G; }',
          '})(this, ' + objStr + ');'
        ].join('\n');
    }
  }
  return result;
}


module.exports = MessageFormat;
