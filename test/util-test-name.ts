export function testName({
  src,
  locale,
  params
}: {
  src: string;
  locale?: string;
  params?: Record<string, unknown>;
}) {
  let name = src;
  if (locale) name += ` [${locale}]`;
  if (params) {
    name += ` / {${Object.entries(params)
      .map(p => ` ${p[0]}: ${p[1]}`)
      .join()} }`;
  }
  return name.replace(/ *\n */g, ' ');
}
