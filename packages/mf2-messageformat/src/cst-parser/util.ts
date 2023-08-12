// WhiteSpace ::= #x9 | #xD | #xA | #x20 /* ws: definition */
export function whitespaces(src: string, start: number): number {
  let length = 0;
  let ch = src[start];
  while (ch === '\t' || ch === '\n' || ch === '\r' || ch === ' ') {
    length += 1;
    ch = src[start + length];
  }
  return length;
}
