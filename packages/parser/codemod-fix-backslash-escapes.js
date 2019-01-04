/**
 * codemod for fixing backslash \escapes to quote 'escapes' in MessageFormat strings
 *
 * messageformat-parser v3 (used by messageformat v2) no longer allows for the
 * characters #{}\ to be escaped with a \ prefix, as well as dropping support
 * for \u0123 character escapes. This codemod can help fix your MessageFormat
 * JSON sources to use ICU MessageFormat 'escapes' instead.
 *
 * To enable jscodeshift to handle JSON input, you'll need to have an
 * appropriate parser available:
 *
 *     npm install --no-save json-estree-ast
 *
 * Then apply the codemod:
 *
 *     npx jscodeshift -t node_modules/messageformat-parser/codemod-fix-backslash-escapes.js [input]
 *
 * If your input includes doubled single quotes '', they will need to be
 * escaped as well; use the command-line option --doubleSingleQuotes=true to
 * enable that. Note that applying the codemod with that option multiple times
 * will double your doubled quotes each time.
 */

let doubleSingleQuotes = false;

const fixEscapes = node => {
  if (node.type !== 'Literal' || typeof node.value !== 'string') return;
  if (doubleSingleQuotes) node.value = node.value.replace(/''+/g, '$&$&');
  node.value = node.value.replace(
    /('*)\\([#{}\\]|u[0-9a-f]{4})('*)/g,
    (_, start, char, end) => {
      switch (char[0]) {
        case 'u': {
          const code = parseInt(char.slice(1), 16);
          return start + String.fromCharCode(code) + end;
        }
        case '\\':
          return `${start}\\${end}`;
        default:
          // Assume multiple ' are already escaped
          if (start === "'") start = "''";
          if (end === "'") end = "''";
          return `'${start}${char}${end}'`;
      }
    }
  );
};

module.exports = ({ source }, { jscodeshift: j }, options) => {
  if (options.doubleSingleQuotes) doubleSingleQuotes = true;
  const ast = j(source);
  ast.find(j.Property).forEach(({ value: { value } }) => fixEscapes(value));
  ast
    .find(j.ArrayExpression)
    .forEach(({ value: { elements } }) => elements.forEach(fixEscapes));
  return ast.toSource();
};

module.exports.parser = require('json-estree-ast');
