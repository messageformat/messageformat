import type tests from './test-messages.json';

type Test = (typeof tests)[number];

export function testName({ src, locale, params }: Test) {
  let name = src;
  if (locale) name += ` [${locale}]`;
  if (params)
    name += ` {${Object.entries(params)
      .map(p => ` ${p[0]}: ${p[1]}`)
      .join()} }`;
  return name.replace(/ *\n */g, ' ');
}
