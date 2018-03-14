#!/usr/bin/env node

/**
 * Copyright 2012-2018 Alex Sexton, Eemeli Aro, and Contributors
 *
 * Licensed under the MIT License
 */

var fs = require('fs'),
    glob = require('glob'),
    MessageFormat = require('messageformat'),
    nopt = require('nopt'),
    path = require('path'),
    knownOpts = {
      'disable-plural-key-checks': Boolean,
      'enable-intl-support': Boolean,
      help: Boolean,
      locale: [String, Array],
      namespace: String,
      simplify: Boolean
    },
    shortHands = {
      h: ['--help'],
      i: ['--enable-intl-support'],
      l: ['--locale'],
      n: ['--namespace'],
      p: ['--disable-plural-key-checks'],
      s: ['--simplify']
    },
    options = nopt(knownOpts, shortHands, process.argv, 2),
    inputFiles = options.argv.remain.map(function(fn) { return path.resolve(fn); });


if (options.help || inputFiles.length === 0) {
  printUsage();
} else {
  var locale = options.locale ? options.locale.join(',').split(/[ ,]+/) : null;
  if (inputFiles.length === 0) inputFiles = [ process.cwd() ];
  var input = readInput(inputFiles, '.json', path.sep);
  if (options.simplify) simplify(input);
  var ns = options.namespace || 'module.exports';
  var mf = new MessageFormat(locale);
  if (options['disable-plural-key-checks']) mf.disablePluralKeyChecks();
  if (options['enable-intl-support']) mf.setIntlSupport(true);
  var output = mf.compile(input).toString(ns);
  console.log(output);
}


function printUsage() {
  var usage = [
    'usage: *messageformat* [options] _input_',
    '',
    'Parses the _input_ JSON file(s) of MessageFormat strings into a JS module of',
    'corresponding hierarchical functions, written to stdout. Directories are',
    'recursively scanned for all .json files.',
    '',
    '  *-l* _lc_, *--locale*=_lc_',
    '        The locale(s) _lc_ to include; if multiple, selected by matching',
    '        message key. [default: *en*]',
    '',
    '  *-i*, *--enable-intl-support*',
    '        Because native or polyfilled support for global Intl object is not',
    '        guaranteed, messageformat will disable Intl formatters by default.',
    '        If you require Intl support, you can use this argument to enable',
    '        Intl formatters for your messages. [default: *false*]',
    '',
    '  *-n* _ns_, *--namespace*=_ns_',
    '        The global object or modules format for the output JS. If _ns_ does not',
    '        contain a \'.\', the output follows an UMD pattern. For module support,',
    '        the values \'*export default*\' (ES6), \'*exports*\' (CommonJS), and',
    '        \'*module.exports*\' (node.js) are special. [default: *module.exports*]',
    '',
    '  *-p*, *--disable-plural-key-checks*',
    '        By default, messageformat throws an error when a statement uses a',
    '        non-numerical key that will never be matched as a pluralization',
    '        category for the current locale. Use this argument to disable the',
    '        validation and allow unused plural keys. [default: *false*]',
    '',
    '  *-s*, *--simplify*',
    '        Simplify the output object structure, by dropping intermediate keys when',
    '        those keys are shared across all objects at that level, in addition to',
    '        the default filtering-out of shared keys at the root of the object.',
    '        [default: *false*]'
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

  var input = {};
  ls.forEach(function(fn) {
    var parts = fn.slice(0, -ext.length).split(sep);
    var last = parts.length - 1;
    parts.reduce(function(root, part, idx) {
      if (idx == last) root[part] = require(fn);
      else if (!(part in root)) root[part] = {};
      return root[part];
    }, input);
  });
  while (true) {
      var keys = Object.keys(input);
      if (keys.length === 1) input = input[keys[0]];
      else break;
  }
  return input;
}

function simplify(input) {
  function getAllObjects(obj, level) {
    if (typeof obj !== 'object') throw new Error('non-object value')
    if (level === 0) return [obj];
    else if (level === 1) return Object.keys(obj).map(k => obj[k]);
    else return Object.keys(obj)
      .map(k => getAllObjects(obj[k], level - 1))
      .reduce((a, b) => a.concat(b), []);
  }

  var lvl = 0;
  try {
    while (true) {
      var objects = getAllObjects(input, lvl);
      var keysets = objects.map(obj => Object.keys(obj).map(k => {
        if (typeof obj[k] !== 'object') throw new Error('non-object value');
        return Object.keys(obj[k]);
      }));
      var key0 = keysets[0][0][0];
      if (keysets.every(keyset => keyset.every(ks => ks.length === 1 && ks[0] === key0))) {
        objects.forEach(obj => Object.keys(obj).forEach(k => obj[k] = obj[k][key0]));
      } else {
        ++lvl;
      }
    }
  } catch (e) {
    if (e.message !== 'non-object value') throw e;
  }
}
