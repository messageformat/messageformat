var loaderUtils = require('loader-utils');
var MessageFormat = require('messageformat');

module.exports = function(content) {
  var query = loaderUtils.parseQuery(this.query);
  var locale = query.locale || 'en';
  var messages = (Array.isArray(this.inputValue) && typeof this.inputValue[0] === 'object') ? this.inputValue[0] : this.exec(content, this.resource);
  var messageFormat = new MessageFormat(locale);
  if (query.disablePluralKeyChecks) {
    messageFormat.disablePluralKeyChecks();
  }
  if (query.intlSupport) {
    messageFormat.setIntlSupport(true);
  }
  var messageFunctions = messageFormat.compile(messages);

  this.cacheable && this.cacheable();
  this.value = [ messageFunctions ];

  return messageFunctions.toString('module.exports');
};
