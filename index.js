var loaderUtils = require('loader-utils');
var MessageFormat = require('messageformat');

module.exports = function(source) {
  var query = loaderUtils.parseQuery(this.query);
  var output = new MessageFormat(query.locale).compile(source).toString('module.exports');
  return output;
};
