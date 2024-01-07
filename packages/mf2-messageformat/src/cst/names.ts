import type { ParseContext } from './parse-cst.js';

// name-start = ALPHA / "_"
//            / %xC0-D6 / %xD8-F6 / %xF8-2FF
//            / %x370-37D / %x37F-1FFF / %x200C-200D
//            / %x2070-218F / %x2C00-2FEF / %x3001-D7FF
//            / %xF900-FDCF / %xFDF0-FFFD / %x10000-EFFFF
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

// name-char = name-start / DIGIT / "-" / "."
//           / %xB7 / %x300-36F / %x203F-2040
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

export function parseNameValue(src: string, start: number): string {
  if (!isNameStartCode(src.charCodeAt(start))) return '';
  let pos = start + 1;
  while (isNameCharCode(src.charCodeAt(pos))) pos += 1;
  return src.substring(start, pos);
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
  { source }: ParseContext,
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
