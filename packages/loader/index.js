var loaderUtils = require('loader-utils');
var MessageFormat = require('messageformat');
var convert = require('messageformat-convert');
var path = require('path');
var YAML = require('yaml');

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

module.exports = function(content) {
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
  var messageFunctions = messageFormat.compileModule(messages);

  this.cacheable && this.cacheable();
  this.value = [messageFunctions];

  return messageFunctions.toString('module.exports');
};
