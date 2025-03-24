import type { DateFormatError } from './get-date-formatter.js';
import { DateToken } from './tokens.js';

const alpha = (width: number) =>
  width < 4 ? 'short' : width === 4 ? 'long' : 'narrow';
const numeric = (width: number) => (width % 2 === 0 ? '2-digit' : 'numeric');

/**
 * Given a parsed ICU date/time formatter pattern,
 * constructs a corresponding `Intl.DateTimeFormat` options structure.
 *
 * @public
 * @param onError - Called if encountering invalid or unsupported tokens,
 *   such as literal strings and day-of-week fields.
 *
 * @example
 * ```js
 * import { getDateTimeFormatOptions, parseDateTokens } from '@messageformat/date-skeleton'
 *
 * const tokens = parseDateTokens('GyMMMMdd', console.error)
 * getDateTimeFormatOptions(tokens, console.error)
 * ```
 *
 * ```js
 * {
 *   era: 'short',
 *   year: 'numeric',
 *   month: 'long',
 *   day: '2-digit'
 * }
 * ```
 */
export function getDateTimeFormatOptions(
  tokens: DateToken[],
  onError: (
    type: DateFormatError['type'],
    message: string,
    token: DateToken
  ) => void
): Intl.DateTimeFormatOptions {
  const options: Intl.DateTimeFormatOptions = {};
  const prevFields = new Set<string | undefined>();
  for (const token of tokens) {
    if (typeof token === 'string') {
      onError('literal', `Ignoring literal part: ${token}`, token);
    } else if ('error' in token) {
      onError('invalid', token.error, token);
    } else {
      const { char, width } = token;

      let field = char;
      switch (char) {
        // era
        case 'G':
          options.era = alpha(width);
          break;

        // year
        case 'y':
          field = 'year';
          options.year = width === 2 ? '2-digit' : 'numeric';
          break;
        case 'u':
        case 'U':
          field = 'year';
          options.year = 'numeric';
          break;
        case 'r':
          field = 'year';
          options.year = 'numeric';
          options.calendar = 'gregory';
          break;

        // month
        case 'M':
        case 'L':
          field = 'month';
          switch (width) {
            case 1:
              options.month = 'numeric';
              break;
            case 2:
              options.month = '2-digit';
              break;
            case 3:
              options.month = 'short';
              break;
            case 4:
              options.month = 'long';
              break;
            default:
              options.month = 'narrow';
              break;
          }
          break;

        // day
        case 'd':
          options.day = numeric(width);
          break;

        // weekday
        case 'E':
        case 'e':
        case 'c':
          field = 'weekday';
          options.weekday = alpha(width);
          break;

        // period
        case 'a':
        case 'b':
          field = 'day-period';
          break;
        case 'B':
          field = 'day-period';
          options.dayPeriod = alpha(width);
          break;

        // hour
        case 'h':
          field = 'hour';
          options.hour = numeric(width);
          options.hourCycle = 'h12';
          break;
        case 'H':
          field = 'hour';
          options.hour = numeric(width);
          options.hourCycle = 'h23';
          break;
        case 'k':
          field = 'hour';
          options.hour = numeric(width);
          options.hourCycle = 'h24';
          break;
        case 'K':
          field = 'hour';
          options.hour = numeric(width);
          options.hourCycle = 'h11';
          break;
        case 'J':
        case 'j':
          field = 'hour';
          options.hour = numeric(width);
          break;
        case 'C':
          field = 'hour';
          options.hour = numeric(width);
          options.dayPeriod = 'short';
          break;

        // minute
        case 'm':
          options.minute = numeric(width);
          break;

        // second
        case 's':
          options.second = numeric(width);
          break;

        // second-fraction
        case 'S':
          options.fractionalSecondDigits = Math.min(width, 3) as 1 | 2 | 3;
          break;

        // timezone
        case 'Z':
          field = 'tz';
          options.timeZoneName = 'longOffset';
          break;
        case 'z':
          field = 'tz';
          options.timeZoneName = width === 4 ? 'long' : 'short';
          break;
        case 'O':
          field = 'tz';
          options.timeZoneName = width === 4 ? 'longOffset' : 'shortOffset';
          break;
        case 'V':
          field = 'tz';
          options.timeZoneName = width === 4 ? 'long' : 'short';
          break;
        case 'v':
          field = 'tz';
          options.timeZoneName = width === 4 ? 'longGeneric' : 'shortGeneric';
          break;
        case 'X':
        case 'x':
          field = 'tz';
          options.timeZoneName = width > 1 ? 'longOffset' : 'shortOffset';
          break;

        case 'Y': // year of week
        case 'Q': // quarter
        case 'q': // quarter
        case 'W': // week of month
        case 'w': // week of year
        case 'D': // day of year
        case 'F': // day of week in month
        case 'g': // julian day
        case 'A': // milliseconds in day
          onError(
            'unsupported',
            `The field ${char} is not supported by Intl.DateTimeFormat`,
            token
          );
          break;

        default:
          onError(
            'invalid',
            `The letter ${char} is not a valid field identifier`,
            token
          );
      }

      if (!prevFields.has(field)) prevFields.add(field);
      else onError('duplicate', `Duplicate ${field} token`, token);
    }
  }
  return options;
}
