var loaderUtils = require('loader-utils');
var MessageFormat = require('messageformat');

module.exports = function(content) {
  var query = loaderUtils.parseQuery(this.query);
  var locale = query.locale || 'en';
  var messages = this.exec(content);
  var messageFunctions = new MessageFormat(locale).compile(messages).toString('module.exports');
  return messageFunctions;
};
