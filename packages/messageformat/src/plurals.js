import pluralCategories from 'make-plural/umd/pluralCategories';
import plurals from 'make-plural/umd/plurals';

/**
 * @class
 * @private
 * @hideconstructor
 * @classdesc Utility getter/wrapper for pluralization functions from
 * {@link http://github.com/eemeli/make-plural.js make-plural}
 */

function wrapPluralFunc(lc, pf, pluralKeyChecks) {
  var fn = function() {
    return pf.apply(this, arguments);
  };
  fn.toString = () => pf.toString();
  if (pluralKeyChecks) {
    const pc = pluralCategories[lc] || {};
    fn.cardinal = pc.cardinal;
    fn.ordinal = pc.ordinal;
  } else {
    fn.cardinal = [];
    fn.ordinal = [];
  }
  return fn;
}

export function getPlural(locale, { pluralKeyChecks }) {
  for (let lc = String(locale); lc; lc = lc.replace(/[-_]?[^-_]*$/, '')) {
    const pf = plurals[lc];
    if (pf) return wrapPluralFunc(lc, pf, pluralKeyChecks);
  }
  throw new Error(
    'Localisation function not found for locale ' + JSON.stringify(locale)
  );
}

export function getAllPlurals({ pluralKeyChecks }) {
  const locales = {};
  const keys = Object.keys(plurals);
  for (let i = 0; i < keys.length; ++i) {
    const lc = keys[i];
    locales[lc] = wrapPluralFunc(lc, plurals[lc], pluralKeyChecks);
  }
  return locales;
}
