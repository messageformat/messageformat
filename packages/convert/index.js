const pluralCategories = require('make-plural/pluralCategories');
const applyReplacements = require('./lib/apply-replacements');
const getPluralMessage = require('./lib/get-plural-message');

const defaultOptions = {
  defaultLocale: 'en',
  includeLocales: null,
  pluralVariable: 'count',
  replacements: null,
  verbose: false
};

const convertData = (data, locale, options) => {
  if (!data) return '';
  if (Array.isArray(data)) {
    return data.map(d => convertData(d, locale, options));
  }
  if (typeof data !== 'object') return applyReplacements(data, options);
  const pluralMsg =
    options.pluralVariable && getPluralMessage(data, locale, options);
  if (pluralMsg) return pluralMsg;

  return Object.keys(data).reduce((res, key) => {
    const { includeLocales: il, verbose } = options;
    const isLcKey = (!il || il.includes(key)) && pluralCategories[key];
    if (isLcKey) {
      options._lc[key] = true;
      if (verbose) console.log(`messageformat-convert: Found locale ${key}`);
    }
    res[key] = convertData(data[key], isLcKey ? key : locale, options);
    return res;
  }, {});
};

const convert = (data, options) => {
  if (data.length === 1) data = data[0];
  options = Object.assign({}, defaultOptions, options);
  options._lc = { [options.defaultLocale]: true };
  const translations = convertData(data, options.defaultLocale, options);
  return {
    locales: Object.keys(options._lc).filter(lc => lc),
    translations
  };
};

module.exports = convert;
