const bidiChars = /^[\u061c\u200e\u200f\u2066-\u2069]+/;
const nameChars =
  /^[-.+0-9A-Z_a-z\u{a1}-\u{61b}\u{61d}-\u{167f}\u{1681}-\u{1fff}\u{200b}-\u{200d}\u{2010}-\u{2027}\u{2030}-\u{205e}\u{2060}-\u{2065}\u{206a}-\u{2fff}\u{3001}-\u{d7ff}\u{e000}-\u{fdcf}\u{fdf0}-\u{fffd}\u{10000}-\u{1fffd}\u{20000}-\u{2fffd}\u{30000}-\u{3fffd}\u{40000}-\u{4fffd}\u{50000}-\u{5fffd}\u{60000}-\u{6fffd}\u{70000}-\u{7fffd}\u{80000}-\u{8fffd}\u{90000}-\u{9fffd}\u{a0000}-\u{afffd}\u{b0000}-\u{bfffd}\u{c0000}-\u{cfffd}\u{d0000}-\u{dfffd}\u{e0000}-\u{efffd}\u{f0000}-\u{ffffd}\u{100000}-\u{10fffd}]+/u;
const notNameStart = /^[-.0-9]/;

export function parseNameValue(
  source: string,
  start: number
): { value: string; end: number } | null {
  let pos = start;
  const startBidi = source.slice(pos).match(bidiChars);
  if (startBidi) pos += startBidi[0].length;

  const match = source.slice(pos).match(nameChars);
  if (!match) return null;
  const name = match[0];
  if (notNameStart.test(name)) return null;
  pos += name.length;

  const endBidi = source.slice(pos).match(bidiChars);
  if (endBidi) pos += endBidi[0].length;

  return { value: name.normalize(), end: pos };
}

export function isValidUnquotedLiteral(str: string): boolean {
  const match = str.match(nameChars);
  return !!match && match[0].length === str.length;
}

export const parseUnquotedLiteralValue = (
  source: string,
  start: number
): string => source.slice(start).match(nameChars)?.[0] ?? '';
