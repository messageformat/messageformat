import { _nf } from 'messageformat-runtime';
import { funcname, propname } from './utils';

export default function stringifyDependencies(compiler, pluralFuncs, runtime) {
  function _stringify(o, level) {
    if (typeof o != 'object') {
      const funcStr = o.toString().replace(/^(function )\w*/, '$1');
      const funcIndent = /([ \t]*)\S.*$/.exec(funcStr);
      return funcIndent
        ? funcStr.replace(new RegExp('^' + funcIndent[1], 'mg'), '')
        : funcStr;
    }
    const s = [];
    for (let i in o) {
      const v = _stringify(o[i], level + 1);
      s.push(level === 0 ? `var ${i} = ${v};\n` : `${propname(i)}: ${v}`);
    }
    if (level === 0) return s.join('');
    if (s.length === 0) return '{}';
    let indent = '  ';
    while (--level) indent += '  ';
    const oc = s.join(',\n').replace(/^/gm, indent);
    return `{\n${oc}\n}`;
  }

  const obj = {};
  const lcKeys = Object.keys(compiler.locales);
  for (let i = 0; i < lcKeys.length; ++i) {
    const lc = lcKeys[i];
    obj[funcname(lc)] = pluralFuncs[lc];
  }
  const rtKeys = Object.keys(compiler.runtime);
  for (let i = 0; i < rtKeys.length; ++i) {
    const fn = rtKeys[i];
    // Cache for Intl.NumberFormat; name may change during minification
    if (fn === 'number') obj[_nf.name] = _nf;
    obj[fn] = runtime[fn];
  }
  if (Object.keys(compiler.formatters).length > 0) {
    obj.fmt = compiler.formatters;
  }
  return _stringify(obj, 0);
}
