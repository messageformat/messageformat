import { MessageSyntaxError } from '../errors.js';
import type { NmtokenParsed } from './data-model.js';

// NameStart ::= [a-zA-Z] | "_"
//             | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF]
//             | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D]
//             | [#x2070-#x218F]
//             | [#x2C00-#x2FEF]
//             | [#x3001-#xD7FF]
//             | [#xF900-#xFDCF]
//             | [#xFDF0-#xFFFD]
//             | [#x10000-#xEFFFF]
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

// NameChar ::= NameStart | [0-9] | "-" | "." | #xB7
//            | [#x0300-#x036F] | [#x203F-#x2040]
const isNameCharCode = (cc: number) =>
  isNameStartCode(cc) ||
  cc === 0x2d || // -
  cc === 0x2e || // .
  (cc >= 0x30 && cc <= 0x39) || // 0-9
  cc === 0xb7 || // ·
  (cc >= 0x300 && cc <= 0x36f) ||
  cc === 0x203f || // ‿
  cc === 0x2040; // ⁀

export function isValidNmtoken(str: string): boolean {
  for (let i = 0; i < str.length; ++i) {
    const cc = str.charCodeAt(i);
    if (!isNameCharCode(cc)) return false;
  }
  return str.length > 0;
}

// Name ::= NameStart NameChar* /* ws: explicit */
export function parseNameValue(src: string, start: number): string {
  if (!isNameStartCode(src.charCodeAt(start))) return '';
  let pos = start + 1;
  while (isNameCharCode(src.charCodeAt(pos))) pos += 1;
  return src.substring(start, pos);
}

// Nmtoken ::= NameChar+ /* ws: explicit */
export function parseNmtoken(
  src: string,
  start: number,
  errors: MessageSyntaxError[]
): NmtokenParsed {
  let pos = start;
  while (isNameCharCode(src.charCodeAt(pos))) pos += 1;
  const value = src.substring(start, pos);
  if (!value) {
    errors.push(new MessageSyntaxError('empty-token', start, start + 1));
  }
  return { type: 'nmtoken', start, end: pos, value };
}
