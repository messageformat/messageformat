/** Trim leading whitespace from each line */
export function source(
  strings: TemplateStringsArray,
  ...expressions: unknown[]
) {
  // concatenate
  let res = strings[0];
  for (let i = 1; i < strings.length; ++i)
    res += String(expressions[i]) + strings[i + 1];

  // remove trailing whitespace + initial newline
  res = res.replace(/[^\S\n]+$/gm, '').replace(/^\n/, '');

  // remove the shortest leading indentation from each line
  const match = res.match(/^[^\S\n]*(?=\S)/gm);
  const indent = match && Math.min(...match.map(el => el.length));
  return indent ? res.replace(new RegExp(`^.{${indent}}`, 'gm'), '') : res;
}
