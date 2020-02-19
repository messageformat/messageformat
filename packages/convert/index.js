const pluralCategories = require('make-plural/pluralCategories');
const commonLength = require('./lib/common-length');

const cldrPluralCategories = ['zero', 'one', 'two', 'few', 'many', 'other'];

const defaultOptions = {
  defaultLocale: 'en',
  includeLocales: null,
  pluralVariable: 'count',
  replacements: [
    { pattern: /[%#]{(\w+)}/g, replacement: '\x02$1\x03' },
    { pattern: /[\\{}#]/g, replacement: '\\$&' },
    { pattern: /\x02/g, replacement: '{' },
    { pattern: /\x03/g, replacement: '}' }
  ],
  schema: 'failsafe',
  verbose: false
};

const getMessageFormat = (msg, { replacements }) =>
  msg
    ? replacements.reduce((msg, { pattern, replacement, state }) => {
        if (state) replacement = replacement.bind(Object.assign({}, state));
        return msg.replace(pattern, replacement);
      }, String(msg))
    : '';

const isPluralObject = (data, locale, { verbose }) => {
  const { cardinal: pluralKeys } = pluralCategories[locale] || {};
  const keys = Object.keys(data);
  if (!pluralKeys || pluralKeys.length === 0 || keys.length === 0) return false;
  if (
    keys.length === pluralKeys.length &&
    keys.every(
      key =>
        pluralKeys.includes(key) &&
        (!data[key] || typeof data[key] !== 'object')
    )
  )
    return true;
  if (verbose && keys.every(key => cldrPluralCategories.includes(key))) {
    console.warn(
      `messageformat-convert: Nearly valid plural for locale ${locale}: ${JSON.stringify(
        data
      )}`
    );
  }
  return false;
};

const getPluralMessage = (data, options) => {
  const keys = Object.keys(data);
  const messages = keys.map(key => getMessageFormat(data[key], options));
  const c0 = commonLength(messages, false);
  const c1 = commonLength(messages, true);

  const prefix = messages[0].slice(0, c0);
  const suffix = c1 > 0 ? messages[0].slice(-c1) : '';
  const pv = options.pluralVariable;
  const pc = keys.map((key, i) => {
    let msg = messages[i];
    if (c1 > 0) msg = msg.slice(c0, -c1);
    else if (c0 > 0) msg = msg.slice(c0);
    return `${key}{${msg}}`;
  });

  return `${prefix}{${pv}, plural, ${pc.join(' ')}}${suffix}`;
};

const convertData = (data, locale, options) => {
  if (!data) {
    return '';
  } else if (Array.isArray(data)) {
    return data.map(d => convertData(d, locale, options));
  } else if (typeof data === 'object') {
    if (options.pluralVariable && isPluralObject(data, locale, options)) {
      return getPluralMessage(data, options);
    } else {
      return Object.keys(data).reduce((res, key) => {
        const { includeLocales: il, verbose } = options;
        const isLcKey = (!il || il.includes(key)) && pluralCategories[key];
        if (isLcKey) {
          options._lc[key] = true;
          if (verbose)
            console.log(`messageformat-convert: Found locale ${key}`);
        }
        res[key] = convertData(data[key], isLcKey ? key : locale, options);
        return res;
      }, {});
    }
  } else {
    return getMessageFormat(data, options);
  }
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
