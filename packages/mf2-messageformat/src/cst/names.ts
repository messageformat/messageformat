const bidiChars = new Set([
  0x061c, // ALM
  0x200e, // LRM
  0x200f, // RLM
  0x2066, // LRI
  0x2067, // RLI
  0x2068, // FSI
  0x2069 // PDI
]);

const isNameStartCode = (cc: number) =>
  (cc >= 0x41 && cc <= 0x5a) || // A-Z
  cc === 0x5f || // _
  (cc >= 0x61 && cc <= 0x7a) || // a-z
  (cc >= 0xc0 && cc <= 0xd6) || // À-Ö
  (cc >= 0xd8 && cc <= 0xf6) || // Ø-ö
  (cc >= 0xf8 && cc <= 0x2ff) ||
  (cc >= 0x370 && cc <= 0x37d) ||
  (cc >= 0x37f && cc <= 0x1fff) ||
  (cc >= 0x200c && cc <= 0x200d) ||
  (cc >= 0x2070 && cc <= 0x2187) ||
  (cc >= 0x2c00 && cc <= 0x2fef) ||
  (cc >= 0x3001 && cc <= 0xd7ff) ||
  (cc >= 0xf900 && cc <= 0xfdcf) ||
  (cc >= 0xfdf0 && cc <= 0xfffd) ||
  (cc >= 0x10000 && cc <= 0xeffff);

const isNameCharCode = (cc: number) =>
  isNameStartCode(cc) ||
  cc === 0x2d || // -
  cc === 0x2e || // .
  (cc >= 0x30 && cc <= 0x39) || // 0-9
  cc === 0xb7 || // ·
  (cc >= 0x300 && cc <= 0x36f) ||
  cc === 0x203f || // ‿
  cc === 0x2040; // ⁀

// This is sticky so that parsing doesn't need to substring the source
const numberLiteral = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][-+]?\d+)?/y;

export function parseNameValue(
  src: string,
  start: number
): { value: string; end: number } | null {
  let pos = start;
  let nameStart = start;
  let cc = src.charCodeAt(start);
  if (bidiChars.has(cc)) {
    pos += 1;
    nameStart += 1;
    cc = src.charCodeAt(pos);
  }
  if (!isNameStartCode(cc)) return null;
  cc = src.charCodeAt(++pos);
  while (isNameCharCode(cc)) cc = src.charCodeAt(++pos);
  const name = src.substring(nameStart, pos);
  if (bidiChars.has(cc)) pos += 1;
  return { value: name, end: pos };
}

export function isValidUnquotedLiteral(str: string): boolean {
  numberLiteral.lastIndex = 0;
  const num = numberLiteral.exec(str);
  if (num && num[0].length === str.length) return true;

  if (!isNameStartCode(str.charCodeAt(0))) return false;
  for (let i = 1; i < str.length; ++i) {
    const cc = str.charCodeAt(i);
    if (!isNameCharCode(cc)) return false;
  }
  return str.length > 0;
}

export function parseUnquotedLiteralValue(
  source: string,
  start: number
): string {
  numberLiteral.lastIndex = start;
  const num = numberLiteral.exec(source);
  if (num) return num[0];

  let pos = start;
  if (isNameStartCode(source.charCodeAt(pos))) {
    pos += 1;
    while (isNameCharCode(source.charCodeAt(pos))) pos += 1;
  }
  return source.substring(start, pos);
}
