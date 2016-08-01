var Compiler = require('./compiler');


/** A set of utility functions that are called by the compiled Javascript
 *  functions, these are included locally in the output of {@link
 *  MessageFormat#compile compile()}.
 *
 * @namespace Runtime
 */
var Runtime = module.exports = {


  /** Utility function for `#` in plural rules
   *
   * @memberof Runtime
   * @param {number} value - The value to operate on
   * @param {string} argumentName - The name of the argument containing `value`
   * @param {number} [offset=0] - An optional offset, set by the surrounding context
   */
  number: function(value, argumentName, offset) {
    if (isNaN(value)) throw new Error("'" + value + "' from argument '" + argumentName + "' isn't a number.");
    return value - (offset || 0);
  },


  /** Utility function for `{N, plural|selectordinal, ...}`
   *
   * @memberof Runtime
   * @param {number} value - The key to use to find a pluralization rule
   * @param {number} offset - An offset to apply to `value`
   * @param {function} lcfunc - A locale function from `pluralFuncs`
   * @param {Object.<string,string>} data - The object from which results are looked up
   * @param {?boolean} isOrdinal - If true, use ordinal rather than cardinal rules
   * @returns {string} The result of the pluralization
   */
  plural: function(value, offset, lcfunc, data, isOrdinal) {
    if ({}.hasOwnProperty.call(data, value)) return data[value];
    if (offset) value -= offset;
    var key = lcfunc(value, isOrdinal);
    if (key in data) return data[key];
    return data.other;
  },


  /** Utility function for `{N, select, ...}`
   *
   * @memberof Runtime
   * @param {number} value - The key to use to find a selection
   * @param {Object.<string,string>} data - The object from which results are looked up
   * @returns {string} The result of the select statement
   */
  select: function(value, data) {
    if ({}.hasOwnProperty.call(data, value)) return data[value];
    return data.other;
  },


  /** @private */
  toString: function(pluralFuncs, fmt, compiler) {
    function _stringify(o, level) {
      if (typeof o != 'object') {
        var funcStr = o.toString().replace(/^(function )\w*/, '$1');
        var indent = /([ \t]*)\S.*$/.exec(funcStr);
        return indent ? funcStr.replace(new RegExp('^' + indent[1], 'mg'), '') : funcStr;
      }
      var s = [];
      for (var i in o) {
        if (level == 0) s.push('var ' + i + ' = ' + _stringify(o[i], level + 1) + ';\n');
        else s.push(Compiler.propname(i) + ': ' + _stringify(o[i], level + 1));
      }
      if (level == 0) return s.join('');
      if (s.length == 0) return '{}';
      var indent = '  '; while (--level) indent += '  ';
      return '{\n' + s.join(',\n').replace(/^/gm, indent) + '\n}';
    }

    var obj = {};
    Object.keys(compiler.locales).forEach(function(lc) { obj[Compiler.funcname(lc)] = pluralFuncs[lc]; });
    Object.keys(compiler.runtime).forEach(function(fn) { obj[fn] = Runtime[fn]; });
    var fmtKeys = Object.keys(compiler.formatters);
    if (fmtKeys.length) obj.fmt = fmtKeys.reduce(function(o, key) { o[key] = fmt[key]; return o; }, {});
    return _stringify(obj, 0);
  }
};

