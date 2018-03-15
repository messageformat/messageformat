#!/usr/bin/env node

/**
 * Copyright 2012-2018 Alex Sexton, Eemeli Aro, and Contributors
 *
 * Licensed under the MIT License
 */

const fs = require('fs');
const glob = require('glob');
const MessageFormat = require('messageformat');
const nopt = require('nopt');
const path = require('path');

const knownOpts = {
  'disable-plural-key-checks': Boolean,
  'esline-disable': Boolean,
  es6: Boolean,
  help: Boolean,
  locale: [String, Array],
  namespace: String,
  outfile: String,
  simplify: Boolean
};
const shortHands = {
  h: ['--help'],
  l: ['--locale'],
  n: ['--namespace'],
  o: ['--outfile'],
  p: ['--disable-plural-key-checks'],
  s: ['--simplify']
};

function getOptions(knownOpts, shortHands) {
  const options = {};
  try {
    const pkgPath = path.resolve('package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    Object.assign(options, pkg.messageformat);
  } catch (e) {}
  try {
    const cfgPath = path.resolve('messageformat.rc.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    Object.assign(options, cfg.messageformat || cfg);
  } catch (e) {}
  if (typeof options.locale === 'string') options.locale = [options.locale];
  const cliOptions = nopt(knownOpts, shortHands, process.argv, 2);
  Object.assign(options, cliOptions);
  if (options.argv.remain.length > 0) options.include = options.argv.remain;
  options.include = (options.include || []).map(fn => path.resolve(fn));
  return options
}

const options = getOptions(knownOpts, shortHands);
if (options.help || options.include.length === 0) {
  printUsage();
} else {
  var locale = options.locale ? options.locale.join(',').split(/[ ,]+/) : null;
  var input = readInput(options.include, '.json', path.sep);
  if (options.simplify) simplify(input);
  var ns = options.namespace || (options.es6 ? 'export default' : 'module.exports');
  var mf = new MessageFormat(locale);
  if (options['disable-plural-key-checks']) mf.disablePluralKeyChecks();
  var output = mf.compile(input).toString(ns);
  if (options['eslint-disable']) output = '/* eslint-disable */\n' + output;
  if (options.outfile && options.outfile !== '-') {
    fs.writeFileSync(path.resolve(options.outfile), output)
  } else {
    console.log(output);
  }
}


function printUsage() {
  var usage = [
    'usage: *messageformat* [options] [_input_]',
    '',
    'Parses the _input_ JSON file(s) of MessageFormat strings into a JS module of',
    'corresponding hierarchical functions. Input directories are recursively',
    'scanned for all .json files.',
    '',
    '  *-l* _lc_, *--locale*=_lc_',
    '        The locale(s) _lc_ to include; if multiple, selected by matching',
    '        message key. [default: *en*]',
    '',
    '  *-n* _ns_, *--namespace*=_ns_, *--es6*',
    '        The global object or modules format for the output JS. If _ns_ does not',
    '        contain a \'.\', the output follows an UMD pattern. The values',
    '        \'*export default*\' (shorthand *--es6*), \'*exports*\', and \'*module.exports*\'',
    '        are special, and are handled appropriately. [default: *module.exports*]',
    '',
    '  *-o* _of_, *--outfile*=_of_',
    '        Write output to the file _of_. If unspecified or \'-\', prints to stdout',
    '',
    'Configuration may also be set in *package.json* or *messageformat.rc.json*. See',
    'the messageformat-cli README for more options.'
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
