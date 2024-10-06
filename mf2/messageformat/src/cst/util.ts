const bidiChars = new Set('\u061C\u200E\u200F\u2066\u2067\u2068\u2069');
const whitespaceChars = new Set('\t\n\r \u3000');

export function whitespaces(
  src: string,
  start: number
): { hasWS: boolean; end: number } {
  let hasWS = false;
  let pos = start;
  let ch = src[pos];
  while (bidiChars.has(ch)) ch = src[++pos];
  while (whitespaceChars.has(ch)) {
    hasWS = true;
    ch = src[++pos];
  }
  while (bidiChars.has(ch) || whitespaceChars.has(ch)) ch = src[++pos];
  return { hasWS, end: pos };
}
