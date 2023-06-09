#!/usr/bin/env node

import { exec } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join, relative, resolve } from 'node:path';
import { parseDocument, YAMLWarning } from 'yaml';

const cwd = process.cwd();

function buildTextMateLanguageFiles() {
  function logError(path, error) {
    const { line, col } = error.linePos[0];
    const severity = error instanceof YAMLWarning ? 'warning' : 'error';
    const msg = error.message.replace(/ at line \d+, column \d+:$.*/ms, '');
    console.error(`${path}(${line},${col}): ${severity} YAML: ${msg}`);
  }

  const srcDir = resolve('src');
  const tgtDir = resolve('syntaxes');
  mkdirSync(tgtDir, { recursive: true });

  for (const fn of readdirSync(srcDir)) {
    if (extname(fn) === '.yaml') {
      const name = basename(fn, '.yaml');
      const src = join(srcDir, fn);
      const raw = readFileSync(src, 'utf-8');
      const tgt = join(tgtDir, `${name}.json`);
      const doc = parseDocument(raw);
      const relSrc = relative(cwd, src);
      for (const error of doc.errors) logError(relSrc, error);
      for (const warn of doc.warnings) logError(relSrc, warn);
      //console.log(`${relSrc} => ${relative(cwd, tgt)}`);
      writeFileSync(tgt, JSON.stringify(doc.toJSON(), null, 2));
    }
  }
}

buildTextMateLanguageFiles();

exec(
  'npx tsc --project tsconfig.build.json',
  { cwd },
  (_error, stdout, stderr) => {
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  }
);
