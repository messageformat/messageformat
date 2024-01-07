const dotProperties = require('dot-properties');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const uv = require('uv');
const YAML = require('yaml');
const JSON5 = require('json5');

function listFiles(include, extensions) {
  const ls = [];
  include.forEach(fn => {
    if (!fs.existsSync(fn)) throw new Error(`Input file not found: ${fn}`);
    if (fs.statSync(fn).isDirectory()) {
      extensions.forEach(ext => {
        ls.push.apply(
          ls,
          glob.sync(path.join(fn, '**/*' + ext), { windowsPathsNoEscape: true })
        );
      });
    } else if (extensions.includes(path.extname(fn))) {
      ls.push(fn);
    } else {
      throw new Error(
        `Unrecognised file extension (expected ${extensions}): ${fn}`
      );
    }
  });
  return ls;
}

function parseFile(fn, ext, sep) {
  switch (ext) {
    // extension list from https://github.com/github/linguist/blob/master/lib/linguist/languages.yml
    case '.ini':
    case '.cfg':
    case '.prefs':
    case '.pro':
    case '.properties': {
      const raw = fs.readFileSync(fn);
      const src = raw.toString(uv(raw) ? 'utf8' : 'latin1');
      return dotProperties.parse(src, sep.test('.'));
    }
    case '.js':
    case '.cjs':
      return require(fn);
    case '.json5':
      return JSON5.parse(fs.readFileSync(fn, 'utf-8'));
    default: {
      const src = fs.readFileSync(fn, 'utf8');
      return YAML.parse(src, { prettyErrors: true });
    }
  }
}

module.exports = function readInput(include, extensions, sep) {
  const ls = listFiles(include, extensions);

  let input = {};
  ls.forEach(fn => {
    const ext = path.extname(fn);
    const parts = fn.slice(0, -ext.length).split(sep);
    const lastIdx = parts.length - 1;
    parts.reduce((root, part, idx) => {
      if (idx === lastIdx) {
        root[part] = parseFile(fn, ext, sep);
      } else if (!(part in root)) {
        root[part] = {};
      }
      return root[part];
    }, input);
  });

  while (input && typeof input === 'object') {
    const keys = Object.keys(input);
    if (keys.length === 1) {
      const child = input[keys[0]];
      if (!child || typeof child !== 'object') break;
      input = child;
    } else {
      break;
    }
  }
  return input;
};
