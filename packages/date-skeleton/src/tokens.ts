export type DateField =
  | 'era'
  | 'year'
  | 'quarter'
  | 'month'
  | 'week'
  | 'day'
  | 'weekday'
  | 'period'
  | 'hour'
  | 'min'
  | 'sec'
  | 'sec-frac'
  | 'ms'
  | 'tz';

export const fields: {
  [symbol: string]: { field: DateField; desc: string };
} = {
  G: { field: 'era', desc: 'Era' },
  y: { field: 'year', desc: 'Year' },
  Y: { field: 'year', desc: 'Year of "Week of Year"' },
  u: { field: 'year', desc: 'Extended year' },
  U: { field: 'year', desc: 'Cyclic year name' },
  r: { field: 'year', desc: 'Related Gregorian year' },
  Q: { field: 'quarter', desc: 'Quarter' },
  q: { field: 'quarter', desc: 'Stand-alone quarter' },
  M: { field: 'month', desc: 'Month in year' },
  L: { field: 'month', desc: 'Stand-alone month in year' },
  w: { field: 'week', desc: 'Week of year' },
  W: { field: 'week', desc: 'Week of month' },
  d: { field: 'day', desc: 'Day in month' },
  D: { field: 'day', desc: 'Day of year' },
  F: { field: 'day', desc: 'Day of week in month' },
  g: { field: 'day', desc: 'Modified julian day' },
  E: { field: 'weekday', desc: 'Day of week' },
  e: { field: 'weekday', desc: 'Local day of week' },
  c: { field: 'weekday', desc: 'Stand-alone local day of week' },
  a: { field: 'period', desc: 'AM/PM marker' },
  b: { field: 'period', desc: 'AM/PM/noon/midnight marker' },
  B: { field: 'period', desc: 'Flexible day period' },
  h: { field: 'hour', desc: 'Hour in AM/PM (1~12)' },
  H: { field: 'hour', desc: 'Hour in day (0~23)' },
  k: { field: 'hour', desc: 'Hour in day (1~24)' },
  K: { field: 'hour', desc: 'Hour in AM/PM (0~11)' },
  j: { field: 'hour', desc: 'Hour in preferred cycle' },
  J: { field: 'hour', desc: 'Hour in preferred cycle without marker' },
  C: { field: 'hour', desc: 'Hour in preferred cycle with flexible marker' },
  m: { field: 'min', desc: 'Minute in hour' },
  s: { field: 'sec', desc: 'Second in minute' },
  S: { field: 'sec-frac', desc: 'Fractional second' },
  A: { field: 'ms', desc: 'Milliseconds in day' },
  z: { field: 'tz', desc: 'Time Zone: specific non-location' },
  Z: { field: 'tz', desc: 'Time Zone' },
  O: { field: 'tz', desc: 'Time Zone: localized' },
  v: { field: 'tz', desc: 'Time Zone: generic non-location' },
  V: { field: 'tz', desc: 'Time Zone: ID' },
  X: { field: 'tz', desc: 'Time Zone: ISO8601 with Z' },
  x: { field: 'tz', desc: 'Time Zone: ISO8601' }
};

/**
 * An object representation of a parsed date skeleton token
 *
 * @public
 */
export type DateToken = {
  char: string;
  error?: Error;
  field?: DateField;
  desc?: string;
  str?: string;
  width: number;
};

const isLetter = (char: string) =>
  (char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z');

function readFieldToken(src: string, pos: number): DateToken {
  const char = src[pos];
  let width = 1;
  while (src[++pos] === char) ++width;
  const field = fields[char];
  if (!field) {
    const msg = `The letter ${char} is not a valid field identifier`;
    return { char, error: new Error(msg), width };
  }
  return { char, field: field.field, desc: field.desc, width };
}

function readQuotedToken(src: string, pos: number): DateToken {
  let str = src[++pos];
  let width = 2;
  if (str === "'") return { char: "'", str, width };
  while (true) {
    let next = src[++pos];
    ++width;
    if (next === undefined) {
      const msg = `Unterminated quoted literal in pattern: ${str || src}`;
      return { char: "'", error: new Error(msg), str, width };
    } else if (next === "'") {
      if (src[++pos] !== "'") return { char: "'", str, width };
      else ++width;
    }
    str += next;
  }
}

function readToken(src: string, pos: number) {
  const char = src[pos];
  if (!char) return null;
  if (isLetter(char)) return readFieldToken(src, pos);
  if (char === "'") return readQuotedToken(src, pos);
  let str = char;
  let width = 1;
  while (true) {
    const next = src[++pos];
    if (!next || isLetter(next) || next === "'") return { char, str, width };
    str += next;
    width += 1;
  }
}

/**
 * Parse an {@link http://userguide.icu-project.org/formatparse/datetime | ICU
 * DateFormat skeleton} string into a {@link DateToken} array.
 *
 * @remarks
 * Errors will not be thrown, but if encountered are included as the relevant
 * token's `error` value.
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
 * //   { char: 'G', field: 'era', desc: 'Era', width: 1 },
 * //   { char: 'r', field: 'year', desc: 'Related Gregorian year', width: 1 },
 * //   { char: 'M', field: 'month', desc: 'Month in year', width: 3 },
 * //   { char: 'd', field: 'day', desc: 'Day in month', width: 2 }
 * // ]
 * ```
 */
export function parseDateTokens(src: string) {
  const tokens: DateToken[] = [];
  let pos = 0;
  while (true) {
    const token = readToken(src, pos);
    if (!token) return tokens;
    tokens.push(token);
    pos += token.width;
  }
}
