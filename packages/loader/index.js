var loaderUtils = require('loader-utils');
var MessageFormat = require('messageformat');
var convert = require('messageformat-convert');

module.exports = function(content) {
  var messages = JSON.parse(content);
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
  var messageFormat = new MessageFormat(locale);
  if (options.disablePluralKeyChecks) {
    messageFormat.disablePluralKeyChecks();
  }
  if (options.intlSupport) {
    messageFormat.setIntlSupport(true);
  }
  if (options.biDiSupport) {
    messageFormat.setBiDiSupport();
  }
  if (options.formatters) {
    messageFormat.addFormatters(options.formatters);
  }
  if (options.strictNumberSign) {
    messageFormat.setStrictNumberSign();
  }
  var messageFunctions = messageFormat.compile(messages);

  this.cacheable && this.cacheable();
  this.value = [messageFunctions];

  return messageFunctions.toString('module.exports');
};
