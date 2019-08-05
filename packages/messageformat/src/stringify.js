import * as Runtime from 'messageformat-runtime';
import { property } from 'safe-identifier';

function stringify(o, level) {
  if (typeof o !== 'object') {
    const funcStr = String(o).replace(/^(function )\w*/, '$1');
    const funcIndent = /([ \t]*)\S.*$/.exec(funcStr);
    return funcIndent
      ? funcStr.replace(new RegExp('^' + funcIndent[1], 'mg'), '')
      : funcStr;
  }
  const s = [];
  for (let i in o) {
    const v = stringify(o[i], level + 1);
    s.push(level === 0 ? `var ${i} = ${v};\n` : `${property(null, i)}: ${v}`);
  }
  if (level === 0) return s.join('');
  if (s.length === 0) return '{}';
  const indent = '  '.repeat(level);
  const oc = s.join(',\n').replace(/^/gm, indent);
  return `{\n${oc}\n}`;
}

export function stringifyDependencies(compiler, plurals) {
  const obj = {};
  for (const lc of Object.keys(compiler.locales)) {
    const plural = plurals.find(pl => pl.id === lc);
    const src = plural.getSource();
    obj[lc] = typeof src === 'string' ? src : src.source;
  }
  for (const fn of Object.keys(compiler.runtime)) {
    if (fn === 'number' || fn === 'strictNumber') obj._nf = Runtime._nf;
    obj[fn] = Runtime[fn];
  }
  if (Object.keys(compiler.formatters).length > 0) {
    obj.fmt = compiler.formatters;
  }
  return stringify(obj, 0);
}

export function stringifyObject(obj, level = 0) {
  if (typeof obj !== 'object') return obj;
  const indent = '  '.repeat(level);
  const o = Object.keys(obj).map(key => {
    const v = stringifyObject(obj[key], level + 1);
    return `\n${indent}  ${property(null, key)}: ${v}`;
  });
  return `{${o.join(',')}\n${indent}}`;
}
