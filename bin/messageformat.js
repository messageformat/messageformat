#!/usr/bin/env node

/**
 * Copyright 2014
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
    "module"    : Boolean,
    "verbose"   : Boolean,
    "help"      : Boolean
  },
  description = {
    "locale"    : "locale(s) to use [mandatory]",
    "inputdir"  : "directory containing messageformat files to compile",
    "output"    : "output where messageformat will be compiled",
    "namespace" : "global object in the output containing the templates",
    "include"   : "glob patterns for files to include from `inputdir`",
    "stdout"    : "print the result in stdout instead of writing in a file",
    "watch"     : "watch `inputdir` for changes",
    "module"    : "create a commonJS module, instead of a global window variable",
    "verbose"   : "print logs for debug"
  },
  defaults = {
    "inputdir"  : process.cwd(),
    "output"    : process.cwd(),
    "watch"     : false,
    "namespace" : 'i18n',
    "include"   : '**/*.json',
    "stdout"    : false,
    "verbose"   : false,
    "module"    : false,
    "help"      : false
  },
  shortHands = {
    "l"  : "--locale",
    "i"  : "--inputdir",
    "o"  : "--output",
    "ns" : "--namespace",
    "I"  : "--include",
    "m"  : "--module",
    "s"  : "--stdout",
    "w"  : "--watch",
    "v"  : "--verbose",
    "?"  : "--help"
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
    if (!o.locale || o.help) {
      var usage = ['Usage: messageformat -l [locale] [OPTIONS] [INPUT_DIR] [OUTPUT_DIR]'];
      if (!o.help) {
        usage.push("Try 'messageformat --help' for more information.");
        console.error(usage.join('\n'));
        process.exit(-1);
      }
      usage.push('\nAvailable options:');
      for (var key in shortHands) {
        var desc = description[shortHands[key].toString().substr(2)];
        if (desc) usage.push('   -' + key + ',\t' + shortHands[key] + (shortHands[key].length < 8 ? '  ' : '') + '\t' + desc);
      }
      console.log(usage.join('\n'));
      process.exit(0);
    }
    if (fs.existsSync(o.output) && fs.statSync(o.output).isDirectory()) {
      o.output = Path.join(o.output, 'i18n.js');
    }
    o.namespace = o.namespace.replace(/^window\./, '')
    return o;
  })(),
  _log = (options.verbose ? function(s) { console.log(s); } : function(){});

function write(options, data) {
  data = data.join('\n');
  if (options.stdout) { _log(''); return console.log(data); }
  fs.writeFile( options.output, data, 'utf8', function(err) {
    if (err) return console.error('--->\t' + err.message);
    _log(options.output + " written.");
  });
}

function parseFileSync(options, mf, file) {
  var path = Path.join(options.inputdir, file),
      lc0 = mf.lc,
      file_parts = file.split(/[.\/]+/),
      r = '';
  if (!fs.statSync(path).isFile()) {
    _log('Skipping ' + file);
    return '';
  }
  for (var i = file_parts.length - 1; i >= 0; --i) {
    if (file_parts[i] in MessageFormat.locale) { mf.lc = file_parts[i]; break; }
  }
  try {
    var text = fs.readFileSync(path, 'utf8'),
          nm = JSON.stringify(file.replace(/\.[^.]*$/, '').replace(/\\/g, '/'));
    _log('Building ' + nm + ' from `' + file + '` with locale "' + mf.lc + '"');
    r = nm + ':' + mf.precompileObject(JSON.parse(text));
  } catch (ex) {
    console.error('--->\tParse error in ' + path + ': ' + ex.message);
  } finally {
    mf.lc = lc0;
  }
  return r;
}

function build(options, callback) {
  var lc = options.locale.trim().split(/[ ,]+/),
      mf = new MessageFormat(lc[0], false),
      compiledMessageFormat = [];
  for (var i = 1; i < lc.length; ++i) MessageFormat.loadLocale(lc[i]);
  _log('Input dir: ' + options.inputdir);
  _log('Included locales: ' + lc.join(', '));
  glob(options.include, {cwd: options.inputdir}, function(err, files) {
    if (!err) async.each(files,
      function(file, cb) {
        var pf = parseFileSync(options, mf, file);
        if (pf) compiledMessageFormat.push(pf);
        cb();
      },
      function() {
        if (options.module) {
          return buildForCommonJSModule(mf, compiledMessageFormat, callback, options);
        } else {
          return buildForWindowGlobal(mf, compiledMessageFormat, callback, options);
        }
      }
    );
  });
}

function buildForCommonJSModule(mf, compiledMessageFormat, callback, options) {
    var data = ['var f = ' + mf.runtime.toString() + ';']
        .concat('module.exports = {' + compiledMessageFormat.join(',\n') + '};\n');
    return callback(options, data);
}

function buildForWindowGlobal(mf, compiledMessageFormat, callback, options) {
    var data = ['(function(G){var f=' + mf.runtime.toString() + ';']
        .concat('G[' + JSON.stringify(options.namespace) + ']={' + compiledMessageFormat.join(',\n') + '}')
        .concat('})(this);\n');
    return callback(options, data);
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
