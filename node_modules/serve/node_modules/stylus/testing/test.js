
/**
 * Module dependencies.
 */

var stylus = require('../')
  , utils = stylus.utils
  , nodes = stylus.nodes
  , str = require('fs').readFileSync(__dirname + '/test.styl', 'utf8')
  , fs = require('fs');

stylus(str)
  //.import(__dirname + '/mixins/vendor')
  .set('filename', __dirname + '/test.styl')
  // .set('compress', true)
  // .set('firebug', true)
  // .set('linenos', true)
  // .set('warn', true)
  .set('include css', true)
  .define('string', 'some string')
  .define('number', 15.5)
  .define('some-bool', true)
  .define('mixin', function(){
    return {
      foo: 'bar',
      bar: 'baz',
      list: [1,2,3]
    }
  })
  .render(function(err, css, js){
  if (err) throw err;
  process.stdout.write(css);
});

