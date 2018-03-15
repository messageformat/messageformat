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
  delimiters: [String, Array],
  'disable-plural-key-checks': Boolean,
  'esline-disable': Boolean,
  es6: Boolean,
  extensions: [String, Array],
  help: Boolean,
  locale: [String, Array],
  namespace: String,
  outfile: String,
  simplify: Boolean
};
const shortHands = {
  d: ['--delimiters'],
  e: ['--extensions'],
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
  const cliOptions = nopt(knownOpts, shortHands, process.argv, 2);
  Object.assign(options, cliOptions);

  // normalise & set default values
  let delim = Array.isArray(options.delimiters)
    ? options.delimiters.join('')
    : typeof options.delimiters === 'string'
      ? options.delimiters
      : '._' + path.sep;
  delim = delim.replace(/[/\\]+/g, '\\' + path.sep).replace(/[-\]]/g, '\\$&');
  options.delimiters = new RegExp(`[${delim}]`);
  options.extensions = options.extensions && options.extensions.length > 0 ? (
    options.extensions.map(ext => ext.trim().replace(/^([^.]*\.)?/, '.'))
  ) : ['.json'];
  if (options.argv.remain.length > 0) options.include = options.argv.remain;
  options.include = (options.include || []).map(fn => path.resolve(fn));
  const lc = Array.isArray(options.locale) ? options.locale.join(',') : options.locale;
  options.locale = lc ? lc.split(/[ ,]+/) : null;
  if (!options.namespace) options.namespace = options.es6 ? 'export default' : 'module.exports';
  return options
}

const options = getOptions(knownOpts, shortHands);
if (options.help || options.include.length === 0) {
  printUsage();
} else {
  const input = readInput(options.include, options.extensions, options.delimiters);
  if (options.simplify) simplify(input);
  const mf = new MessageFormat(options.locale);
  if (options['disable-plural-key-checks']) mf.disablePluralKeyChecks();
  let output = mf.compile(input).toString(options.namespace);
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


function readInput(include, extensions, sep) {
  const ls = [];
  include.forEach((fn) => {
    if (!fs.existsSync(fn)) throw new Error(`Input file not found: ${fn}`);
    if (fs.statSync(fn).isDirectory()) {
      extensions.forEach(ext => {
        ls.push.apply(ls, glob.sync(path.join(fn, '**/*' + ext)));
      })
    } else if (extensions.includes(path.extname(fn))) {
      ls.push(fn);
    } else {
      throw new Error(`Unrecognised file extension (expected ${extensions}): ${fn}`);
    }
  });

  let input = {};
  ls.forEach((fn) => {
    const ext = path.extname(fn);
    const parts = fn.slice(0, -ext.length).split(sep);
    const lastIdx = parts.length - 1;
    parts.reduce((root, part, idx) => {
      if (idx == lastIdx) root[part] = require(fn);
      else if (!(part in root)) root[part] = {};
      return root[part];
    }, input);
  });
  while (true) {
      const keys = Object.keys(input);
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
