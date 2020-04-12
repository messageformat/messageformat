import { property } from 'safe-identifier';
import Compiler, { RuntimeMap, StringStructure } from './compiler';
import MessageFormat from './messageformat';
import { PluralObject } from './plurals';

function stringifyRuntime(runtime: RuntimeMap) {
  const imports: { [key: string]: string[] } = {};
  const vars: { [key: string]: string } = {};

  for (const [name, fn] of Object.entries(runtime)) {
    if (fn.module) {
      const prev = imports[fn.module];
      imports[fn.module] = prev ? [...prev, name] : [name];
    } else {
      vars[name] = String(fn);
    }
  }

  const is = Object.entries(imports).map(
    ([module, names]) =>
      `import { ${names.sort().join(', ')} } from '${module}';`
  );
  const vs = Object.entries(vars).map(([id, value]) =>
    new RegExp(`^function ${id}\\b`).test(value)
      ? value
      : `const ${id} = ${value};`
  );

  if (is.length > 0 && vs.length > 0) is.push('');
  return is.concat(vs).join('\n');
}

function stringifyObject(obj: string | StringStructure, level = 0): string {
  if (typeof obj !== 'object') return obj;
  const indent = '  '.repeat(level);
  const o = Object.keys(obj).map(key => {
    const v = stringifyObject(obj[key], level + 1);
    return `\n${indent}  ${property(null, key)}: ${v}`;
  });
  return `{${o.join(',')}\n${indent}}`;
}

/**
 * Compile a collection of messages into an ES module.
 *
 * ```js
 * import compileModule from 'messageformat/compile-module'
 * ```
 *
 * With `messages` as a hierarchical structure of ICU MessageFormat strings,
 * the output of `compileModule()` will be the source code of an ES module with
 * a default export matching the input structure, with each string replaced by
 * its corresponding JS function.
 *
 * If this MessageFormat instance has been initialized with support for more
 * than one locale, using a key that matches the locale's identifier at any
 * depth of a `messages` object will set its child elements to use that locale.
 *
 * @example
 * ```js
 * import fs from 'fs'
 * import MessageFormat from 'messageformat'
 * import compileModule from 'messageformat/compile-module'
 *
 * const mf = new MessageFormat('en')
 * const msgSet = {
 *   a: 'A {TYPE} example.',
 *   b: 'This has {COUNT, plural, one{one member} other{# members}}.',
 *   c: 'We have {P, number, percent} code coverage.'
 * }
 * const msgModule = compileModule(mf, msgSet)
 * fs.writeFileSync('messages.js', msgModule)
 *
 * ...
 *
 * import messages from './messages'
 *
 * messages.a({ TYPE: 'more complex' })  // 'A more complex example.'
 * messages.b({ COUNT: 3 })              // 'This has 3 members.'
 * ```
 */
export default function compileModule(
  messageformat: MessageFormat,
  messages: StringStructure
) {
  const { plurals } = messageformat;
  const cp: { [key: string]: PluralObject } = {};
  if (plurals.length > 1)
    for (const pl of plurals) cp[pl.lc] = cp[pl.locale] = pl;
  const compiler = new Compiler(messageformat.options);
  const msgObj = compiler.compile(messages, plurals[0], cp);
  const msgStr = stringifyObject(msgObj);
  const rtStr = stringifyRuntime(compiler.runtime);
  return `${rtStr}\nexport default ${msgStr}`;
}
