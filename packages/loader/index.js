var loaderUtils = require('loader-utils');
var MessageFormat = require('messageformat');
var convert = require('messageformat-convert');
var YAML = require('yaml');

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
  const mfOpt = {};
  if (options.biDiSupport) mfOpt.biDiSupport = true;
  if (options.customFormatters || options.formatters) {
    mfOpt.customFormatters = options.customFormatters || options.formatters;
  }
  if (options.strictNumberSign) mfOpt.strictNumberSign = true;
  var messageFormat = new MessageFormat(locale, mfOpt);
  var messageFunctions = messageFormat.compile(messages);

  this.cacheable && this.cacheable();
  this.value = [messageFunctions];

  return messageFunctions.toString('module.exports');
};
