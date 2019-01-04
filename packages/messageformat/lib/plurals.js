var categories = require('make-plural/umd/pluralCategories');
var plurals = require('make-plural/umd/plurals');

/**
 * @class
 * @private
 * @hideconstructor
 * @classdesc Utility getter/wrapper for pluralization functions from
 * {@link http://github.com/eemeli/make-plural.js make-plural}
 */

function wrapPluralFunc(lc, pf, noPluralKeyChecks) {
  var fn = function() {
    return pf.apply(this, arguments);
  };
  fn.toString = function() {
    return pf.toString();
  };
  if (noPluralKeyChecks) {
    fn.cardinal = [];
    fn.ordinal = [];
  } else {
    var pc = categories[lc] || {};
    fn.cardinal = pc.cardinal;
    fn.ordinal = pc.ordinal;
  }
  return fn;
}

function get(locale, noPluralKeyChecks) {
  for (var l = locale; l; l = l.replace(/[-_]?[^-_]*$/, '')) {
    var pf = plurals[l];
    if (pf) return wrapPluralFunc(l, pf, noPluralKeyChecks);
  }
  throw new Error(
    'Localisation function not found for locale ' + JSON.stringify(locale)
  );
}

function getAll(noPluralKeyChecks) {
  return Object.keys(plurals).reduce(function(locales, lc) {
    locales[lc] = wrapPluralFunc(lc, plurals[lc], noPluralKeyChecks);
    return locales;
  }, {});
}

module.exports = {
  get: get,
  getAll: getAll
};
