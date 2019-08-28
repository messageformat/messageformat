import * as Runtime from 'messageformat-runtime';
import { property } from 'safe-identifier';

export function stringifyDependencies(compiler, plurals) {
  const imports = {};
  const vars = {};

  for (const lc of Object.keys(compiler.locales)) {
    const plural = plurals.find(pl => pl.id === lc);
    const { module, source } = plural.getSource();
    if (module) {
      const prev = imports[module];
      imports[module] = prev ? [...prev, lc] : [lc];
    } else {
      vars[lc] = source;
    }
  }

  for (const fn of Object.keys(compiler.runtime)) {
    if (fn === 'number' || fn === 'strictNumber') vars._nf = Runtime._nf;
    vars[fn] = Runtime[fn];
  }

  const fmt = Object.entries(compiler.formatters).map(
    ([name, fn]) => `${property(null, name)}: ${String(fn)}`
  );
  if (fmt.length > 0) vars.fmt = `{\n${fmt.join(',\n')}\n}`;

  const is = Object.entries(imports).map(
    ([module, names]) =>
      `import { ${names.sort().join(', ')} } from '${module}';`
  );
  const vs = Object.entries(vars).map(
    ([id, value]) => `const ${id} = ${value};`
  );

  if (is.length > 0 && vs.length > 0) is.push('');
  return is.concat(vs).join('\n');
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
