const pluralCategories = require('make-plural/pluralCategories');
const applyReplacements = require('./apply-replacements');
const commonLength = require('./common-length');

const cldrPluralCategories = ['zero', 'one', 'two', 'few', 'many', 'other'];

function isPluralObject(data, locale, { verbose }) {
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
  ) {
    return true;
  }
  if (verbose && keys.every(key => cldrPluralCategories.includes(key))) {
    const msg = `Possible plural with keys not supported by ${locale}`;
    console.warn(`messageformat-convert: ${msg}: ${JSON.stringify(data)}`);
  }
  return false;
}

/**
 * If `data` is an object with keys matching the plural cases of `locale` and
 * string values, returns a corresponding MessageFormat string. Otherwise (or if
 * `options.pluralVariable` is empty) returns `null`.
 */
module.exports = function getPluralMessage(data, locale, options) {
  if (!options.pluralVariable || !isPluralObject(data, locale, options)) {
    return null;
  }
  const keys = Object.keys(data);
  const messages = keys.map(key => applyReplacements(data[key], options));
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
