var loaderUtils = require('loader-utils');
var MessageFormat = require('messageformat');

module.exports = function(content) {
  var query = loaderUtils.parseQuery(this.query);
  var locale = query.locale || 'en';
  var messages = typeof this.inputValue === 'object' ? this.inputValue : this.exec(content);
  var messageFunctions = new MessageFormat(locale).compile(messages);

  this.cacheable && this.cacheable();
  this.value = messageFunctions;

  return messageFunctions.toString('module.exports');
};
