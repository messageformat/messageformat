#!/usr/bin/env node

var optimist    = require('optimist'),
  fs            = require('fs'),
  vm            = require('vm'),
  coffee        = require('coffee-script'), /* only for watchr */
  watch         = require('watchr').watch,
  join          = require('path').join,
  glob          = require("glob"),
  async         = require('async'),
  MessageFormat = require('../'),
  _             = require('underscore'),
  optimist      = optimist.usage('Usage: $0 [INPUT_DIR] [OUTPUT]')
  .alias('locale', 'l')
  .describe('locale', 'locale to use')
  .demand('locale')
  .alias('inputdir', 'i')
  .describe('inputdir', 'directory containings messageformat file to compile')
  .alias('output', 'o')
  .describe('output', 'output where messageformat will be compiled')
  .alias('watch', 'w')
  .describe('watch', 'watch `inputdir` for change')
  .alias('namespace', 'ns')
  .describe('namespace', 'object in the browser containing the templates')
  .alias('include', 'I')
  .describe('include', 'Glob patterns for templates files to include in `inputdir`')
  .alias('stdout', 's')
  .describe('stdout', 'Print the result in stdout instead of writing in a file')
  .alias('verbose', 'v')
  .describe('verbose', 'Print logs for debug')
  .default('inputdir', process.cwd())
  .default('output', process.cwd())
  .default('watch', false)
  .default('namespace', 'window.i18n')
  .default('include', '**/*.json')
  .default('stdout', false)
  .default('verbose', false),
  options = optimist.argv,
  inputdir;

if(options._ && options._.length >=1 ) options.inputdir = options._[0];
if(options._ && options._.length >=2 ) options.output = options._[1];

if(!options.inputdir || !options.output) return optimist.showHelp();
var inputdir = options.inputdir;


compile();
if(options.watch){
  return watch(options.inputdir, _.debounce(compile, 100));
}


function handleError( err, data ){
  if(err){
    err = err.message ? err.message : err;
    return console.error('--->\t'+ err);
  }
}

function compile(){
  build(inputdir, options, function(err, data){
    if( err ) return handleError( err );
    write(data, function(err, output){
      if( err ) return handleError( err );
      if( options.verbose ) console.log(output + " written.");
    })
  });
}

function write( data, callback ){
  data = data.join('\n');
  if(options.stdout) {
    return console.log(data);
  }
  var output = options.output;
  fs.stat(output, function(err, stat){
    if(err){
      // do nothing
    }else if(stat.isFile()){
      // do nothing
    }else if(stat.isDirectory()){
      // if `output` is a directory, create a new file called `i18n.js` in this directory.
      output = join(output, 'i18n.js');
    }else{
      return engines.handleError(ouput, 'is not a file nor a directory');
    }

    fs.writeFile( output, data, 'utf8', function( err ){
      if( typeof callback == "function" ) callback(err, output);
    });
  });
};



function build(inputdir, options, callback){
  // arrays of compiled templates
  var compiledMessageFormat = [];

  // read locale file
  var localeFile = join(__dirname, '..', 'locale', options.locale + '.js');
  if(options.verbose) console.log('Load locale file: ' + localeFile);
  fs.readFile(localeFile, function(err, localeStr){
    if(err) handleError(new Error('locale ' + options.locale + ' not supported.' ));
    var script = vm.createScript(localeStr);
    // needed for runInThisContext
    global.MessageFormat = MessageFormat;
    script.runInThisContext();

    if( options.verbose ) { console.log('Read dir: ' + inputdir); }
    // list each file in inputdir folder and subfolders
    glob(join(inputdir, options.include), function(err, files){
      files = files.map(function(file){
        // normalize the file name
        return file.replace(inputdir, '').replace(/^\//, '');
      })

      async.forEach(files, readFile, function(err){
        // errors are logged in readFile. No need to print them here.
        var fileData = [
          '(function(){ ' + options.namespace + ' || (' + options.namespace + ' = {}) ',
          'var MessageFormat = { locale: {} };',
          localeStr
        ].concat(compiledMessageFormat)
        .concat(['})();']);
        return callback(null, _.flatten(fileData));
      });

      // Read each file, compile them, and append the result in the `compiledI18n` array
      function readFile(file, cb){
        var path = join(inputdir, file);
        fs.stat(path, function(err, stat){
          if(err) { handleError(err); return  cb(); }
          if(!stat.isFile()) {
            if( options.verbose ) { handleError('Skip ' + file); }
            return cb();
          }

          fs.readFile(path, 'utf8', function(err, text){
            if(err) { handleError(err); return cb() }

            var nm = join(file).split('.')[0];

            if( options.verbose ) console.log('Building ' + options.namespace + '["' + nm + '"]');
            compiledMessageFormat.push(compiler( options, nm, JSON.parse(text) ));
            cb();
          });
        });
      }
    });
  });
}

function compiler(options, nm, obj){
  var mf = new MessageFormat(options.locale),
    compiledMessageFormat = [options.namespace + '["' + nm + '"] = {}'];

  _(obj).forEach(function(value, key){
    var str = mf.precompile( mf.parse(value) );
    compiledMessageFormat.push(options.namespace + '["' + nm + '"]["' + key + '"] = ' + str);
  });
  return compiledMessageFormat;
}
