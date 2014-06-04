#!/usr/bin/env node

var
  nopt          = require('nopt'),
  fs            = require('fs'),
  Path          = require('path'),
  glob          = require('glob'),
  async         = require('async'),
  MessageFormat = require('../'),
  knownOpts = {
    "locale"    : String,
    "inputdir"  : Path,
    "output"    : Path,
    "watch"     : Boolean,
    "namespace" : String,
    "include"   : String,
    "stdout"    : Boolean,
    "verbose"   : Boolean
  },
  description = {
    "locale"    : "locale to use [mandatory]",
    "inputdir"  : "directory containing messageformat files to compile",
    "output"    : "output where messageformat will be compiled",
    "namespace" : "global object in the output containing the templates",
    "include"   : "glob patterns for files to include from `inputdir`",
    "stdout"    : "print the result in stdout instead of writing in a file",
    "watch"     : "watch `inputdir` for changes",
    "verbose"   : "print logs for debug"
  },
  defaults = {
    "inputdir"  : process.cwd(),
    "output"    : process.cwd(),
    "watch"     : false,
    "namespace" : 'i18n',
    "include"   : '**/*.json',
    "stdout"    : false,
    "verbose"   : false
  },
  shortHands = {
    "l"  : "--locale",
    "i"  : "--inputdir",
    "o"  : "--output",
    "ns" : "--namespace",
    "I"  : "--include",
    "s"  : "--stdout",
    "w"  : "--watch",
    "v"  : "--verbose"
  },
  options = (function() {
    var o = nopt(knownOpts, shortHands, process.argv, 2);
    for (var key in defaults) {
      o[key] = o[key] || defaults[key];
    }
    if (o.argv.remain) {
      if (o.argv.remain.length >= 1) o.inputdir = o.argv.remain[0];
      if (o.argv.remain.length >= 2) o.output = o.argv.remain[1];
    }
    if (!o.locale) {
      console.error('Usage: messageformat -l [locale] [INPUT_DIR] [OUTPUT_DIR]\n')
      process.exit(-1);
    }
    if (fs.statSync(o.output).isDirectory()) {
      o.output = Path.join(o.output, 'i18n.js');
    }
    o.namespace = o.namespace.replace(/^window\./, '')
    return o;
  })(),
  _log = (options.verbose ? function(s) { console.log(s); } : function(){});

function write(options, data) {
  data = data.join('\n');
  if (options.stdout) return console.log(data);
  fs.writeFile( options.output, data, 'utf8', function(err) {
    if (err) return console.error('--->\t' + err.message);
    _log(options.output + " written.");
  });
}

function parseFileSync(options, mf, file) {
  var path = Path.join(options.inputdir, file);
  if (!fs.statSync(path).isFile()) {
    _log('Skipping ' + file);
    return '';
  }
  try {
    var text = fs.readFileSync(path, 'utf8'),
          nm = file.replace(/\.[^.]*$/, '').replace(/\\/g, '/'),
          gn = mf.globalName + '["' + nm + '"]',
         cmf = mf.precompileObject(JSON.parse(text));
    _log('Building ' + gn);
  } catch (ex) {
    console.error('--->\tParse error in ' + path + ': ' + ex.message);
    return '';
  }
  return gn + '=' + cmf;
}

function build(options, callback) {
  var mf = new MessageFormat(options.locale, false, options.namespace),
      compiledMessageFormat = [];
  _log('Input dir: ' + options.inputdir);
  glob(options.include, {cwd: options.inputdir}, function(err, files) {
    async.each(
      files.map(function(file) { return file.replace(options.inputdir, '').replace(/^\//, ''); }),
      function(file, cb) {
        var pf = parseFileSync(options, mf, file);
        if (pf) compiledMessageFormat.push(pf);
        cb();
      },
      function() {
        var data = ['(function(G){G[\'' + mf.globalName + '\']=' + mf.functions()]
          .concat(compiledMessageFormat)
          .concat('})(this);\n');
        return callback(options, data);
      }
    );
  });
}


build(options, write);

if (options.watch) {
  _log('watching for changes in ' + options.inputdir + '...\n');
  require('watchr').watch({
    path: options.inputdir,
    ignorePaths: [ options.output ],
    listener: function(changeType, filePath) { if (/\.json$/.test(filePath)) build(options, write); }
  });
}
