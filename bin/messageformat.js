#!/usr/bin/env node

/**
 * Copyright 2012-2014 Alex Sexton, Eemeli Aro, and Contributors
 *
 * Licensed under the MIT License
 */

var
  nopt          = require('nopt'),
  Path          = require('path'),
  runner        = require('../lib/messageformat-runner'),
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
    return o;
  })(),
  _log = (options.verbose ? function(s) { console.log(s); } : function(){});

runner(options);

if (options.watch) {
  _log('watching for changes in ' + options.inputdir + '...\n');
  require('watchr').watch({
    path: options.inputdir,
    ignorePaths: [ options.output ],
    listener: function(changeType, filePath) { if (/\.json$/.test(filePath)) runner(options); }
  });
}
