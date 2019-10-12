#!/usr/bin/env node

const fs = require('fs');
const MessageFormat = require('messageformat');
const compileModule = require('messageformat/compile-module');
const path = require('path');

const getOptions = require('./lib/options');
const readInput = require('./lib/read-input');
const simplifyInput = require('./lib/simplify-input');

const {
  delimiters,
  'eslint-disable': eslintDisable,
  extensions,
  locale,
  options,
  outfile,
  simplify,
  _: include
} = getOptions();
const input = readInput(include, extensions, delimiters);
if (simplify) simplifyInput(input);

const mf = new MessageFormat(locale, options);
let output = compileModule(mf, input);
if (eslintDisable) output = '/* eslint-disable */\n' + output;

if (outfile && outfile !== '-') {
  fs.writeFileSync(path.resolve(outfile), output);
} else {
  console.log(output);
}
