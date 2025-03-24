/**
 * An object representation of a parsed date skeleton token
 *
 * @public
 */
export type DateToken =
  | string
  | { char: string; width: number }
  | { error: string };

const isLetter = (char: string) =>
  (char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z');

/**
 * Parse an {@link https://unicode-org.github.io/icu/userguide/format_parse/datetime/ | ICU
 * DateFormat skeleton} string into a {@link DateToken} array.
 *
 * @remarks
 * Errors will not be thrown, but if encountered are included as an `{ error }` token.
 *
 * @public
 * @param src - The skeleton string
 *
 * @example
 * ```js
 * import { parseDateTokens } from '@messageformat/date-skeleton'
 *
 * parseDateTokens('GrMMMdd', console.error)
 * // [
 * //   { char: 'G', width: 1 },
 * //   { char: 'r', width: 1 },
 * //   { char: 'M', width: 3 },
 * //   { char: 'd', width: 2 }
 * // ]
 * ```
 */
export function parseDateTokens(src: string) {
  const tokens: DateToken[] = [];
  let pos = 0;
  while (true) {
    const char = src[pos];
    if (!char) break;

    let token: DateToken;
    if (isLetter(char)) {
      let width = 1;
      while (src[++pos] === char) ++width;
      token = { char, width };
    } else if (char === "'") {
      let str = src[++pos];
      if (str === "'") {
        // single ' escaped as ''
        token = str;
        ++pos;
      } else {
        while (true) {
          const next = src[++pos];
          if (next === undefined) {
            token = { error: `Unterminated quoted literal in pattern: ${src}` };
            --pos;
            break;
          } else if (next === "'") {
            if (src[++pos] !== "'") {
              // single ' escaped as ''
              token = str;
              break;
            }
          }
          str += next;
        }
      }
    } else {
      let str = char;
      while (true) {
        const next = src[++pos];
        if (!next || isLetter(next) || next === "'") {
          token = str;
          break;
        }
        str += next;
      }
    }
    tokens.push(token);
  }
  return tokens;
}
