const loaderUtils = require('loader-utils');
const MessageFormat = require('@messageformat/core');
const compileModule = require('@messageformat/core/compile-module');
const convert = require('@messageformat/convert');
const path = require('path');
const YAML = require('yaml');

function localeFromResourcePath(resourcePath, locales) {
  const parts = resourcePath.split(/[._/\\]+/);
  let locale = null;
  let lcPos = -1;
  for (const lc of locales) {
    const idx = parts.indexOf(lc);
    if (idx > lcPos) {
      locale = lc;
      lcPos = idx;
    }
  }
  return locale || locales;
}

module.exports = function loadMessages(content) {
  var messages = YAML.parse(content);
  var options = loaderUtils.getOptions(this) || {};
  var locale = options.locale;
  if (options.convert) {
    var cm = convert(messages, options.convert);
    if (!locale) {
      locale = cm.locales;
    }
    messages = cm.translations;
  }
  if (typeof locale === 'string' && locale.indexOf(',') !== -1)
    locale = locale.split(',');
  if (Array.isArray(locale) && locale.length > 1) {
    var relPath = path.relative(process.cwd(), this.resourcePath);
    locale = localeFromResourcePath(relPath, locale);
  }
  const mfOpt = {};
  if (options.biDiSupport) mfOpt.biDiSupport = true;
  if (options.customFormatters || options.formatters) {
    mfOpt.customFormatters = options.customFormatters || options.formatters;
  }
  if (options.strictNumberSign) mfOpt.strictNumberSign = true;
  var messageFormat = new MessageFormat(locale, mfOpt);
  return compileModule(messageFormat, messages);
};
