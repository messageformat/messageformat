#!/usr/bin/env node

/**
 * Copyright 2012-2016 Alex Sexton, Eemeli Aro, and Contributors
 *
 * Licensed under the MIT License
 */

var fs = require('fs'),
    glob = require('glob'),
    MessageFormat = require('../'),
    nopt = require('nopt'),
    path = require('path'),
    knownOpts = {
      help: Boolean,
      locale: [String, Array],
      namespace: String,
      'disable-plural-key-checks': Boolean
    },
    shortHands = {
      h: ['--help'],
      l: ['--locale'],
      n: ['--namespace'],
      p: ['--disable-plural-key-checks']
    },
    options = nopt(knownOpts, shortHands, process.argv, 2),
    inputFiles = options.argv.remain.map(function(fn) { return path.resolve(fn); });


if (options.help || inputFiles.length === 0) {
  printUsage();
} else {
  var locale = options.locale ? options.locale.join(',').split(/[ ,]+/) : null;
  if (inputFiles.length === 0) inputFiles = [ process.cwd() ];
  var input = readInput(inputFiles, '.json', '/');
  var ns = options.namespace || 'module.exports';
  var mf = new MessageFormat(locale);
  if (options['disable-plural-key-checks']) mf.disablePluralKeyChecks();
  var output = mf.compile(input).toString(ns);
  console.log(output);
}


function printUsage() {
  var usage = [
    'usage: *messageformat* [*-l* _lc_] [*-n* _ns_] [*-p*] _input_',
    '',
    'Parses the _input_ JSON file(s) of MessageFormat strings into a JS module of',
    'corresponding hierarchical functions, written to stdout. Directories are',
    'recursively scanned for all .json files.',
    '',
    '  *-l* _lc_, *--locale*=_lc_',
    '        The locale(s) _lc_ to include; if multiple, selected by matching',
    '        message key. [default: *en*]',
    '',
    '  *-n* _ns_, *--namespace*=_ns_',
    '        The global object or modules format for the output JS. If _ns_ does not',
    '        contain a \'.\', the output follows an UMD pattern. For module support,',
    '        the values \'*export default*\' (ES6), \'*exports*\' (CommonJS), and',
    '        \'*module.exports*\' (node.js) are special. [default: *module.exports*]',
    '',
    '  *-p*, *--disable-plural-key-checks*',
    '        By default, messageformat.js throws an error when a statement uses a',
    '        non-numerical key that will never be matched as a pluralization',
    '        category for the current locale. Use this argument to disable the',
    '        validation and allow unused plural keys. [default: *false*]'
  ].join('\n');
  if (process.stdout.isTTY) {
    usage = usage.replace(/_(.+?)_/g, '\x1B[4m$1\x1B[0m')
                 .replace(/\*(.+?)\*/g, '\x1B[1m$1\x1B[0m');
  } else {
    usage = usage.replace(/[_*]/g, '');
  }
  console.log(usage);
}


function readInput(include, ext, sep) {
  // modified from http://stackoverflow.com/a/1917041
  function sharedPathLength(array) {
    var A = array.sort(), a1 = A[0], a2 = A[A.length - 1], len = a1.length, i = 0;
    while (i < len && a1.charAt(i) === a2.charAt(i)) ++i;
    return a1.substring(0, i).replace(/[^/]+$/, '').length;
  }

  var ls = [];
  include.forEach(function(fn) {
    if (!fs.existsSync(fn)) throw new Error('Input file not found: ' + fn);
    if (fs.statSync(fn).isDirectory()) {
      ls.push.apply(ls, glob.sync(path.join(fn, '**/*' + ext)));
    } else {
      if (path.extname(fn) !== ext) throw new Error('Input file extension is not ' + ext + ': ' + fn);
      ls.push(fn);
    }
  });

  var start = sharedPathLength(ls);
  var end = -1 * ext.length;
  var input = {};
  ls.forEach(function(fn) {
    var key = fn.slice(start, end);
    var parts = key.split(sep);
    var last = parts.length - 1;
    parts.reduce(function(root, part, idx) {
      if (idx == last) root[part] = require(fn);
      else if (!(part in root)) root[part] = {};
      return root[part];
    }, input);
  });
  return input;
}
