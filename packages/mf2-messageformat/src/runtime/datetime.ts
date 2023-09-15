import { MessageResolutionError } from '../errors.js';
import type {
  MessageExpressionPart,
  MessageFunctionContext,
  MessageValue
} from './index.js';
import {
  asBoolean,
  asPositiveInteger,
  asString,
  mergeLocales
} from './utils.js';

export interface MessageDateTime extends MessageValue {
  readonly type: 'datetime';
  readonly source: string;
  readonly locale: string;
  readonly options: Readonly<Intl.DateTimeFormatOptions>;
  toParts(): [MessageDateTimePart];
  toString(): string;
  valueOf(): Date;
}

export interface MessageDateTimePart extends MessageExpressionPart {
  type: 'datetime';
  source: string;
  locale: string;
  parts: Intl.DateTimeFormatPart[];
}

/**
 * `datetime` accepts an optional Date, number or string as its input
 * and formats it with the same options as
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat | Intl.DateTimeFormat}.
 * If not given any argument, the current date/time is used.
 *
 * @beta
 */
export function datetime(
  { localeMatcher, locales, source }: MessageFunctionContext,
  options: Record<string, unknown>,
  input?: unknown
): MessageDateTime {
  const lc = mergeLocales(locales, input, options);
  const opt: Intl.DateTimeFormatOptions = { localeMatcher };
  if (input && typeof input === 'object') {
    if (input && 'options' in input) Object.assign(opt, input.options);
    if (!(input instanceof Date) && typeof input.valueOf === 'function') {
      input = input.valueOf();
    }
  }

  let value: unknown;
  switch (typeof input) {
    case 'number':
    case 'string':
      value = new Date(input);
      break;
    case 'object':
      value = input;
      break;
    case 'undefined':
      value = new Date();
      break;
  }
  if (!(value instanceof Date)) {
    const msg = 'Input is not a date';
    throw new MessageResolutionError('bad-input', msg, source);
  }

  for (const [name, value] of Object.entries(options)) {
    try {
      switch (name) {
        case 'locale':
          break;
        case 'fractionalSecondDigits':
          // @ts-expect-error TS types don't know about fractionalSecondDigits
          opt[name] = asPositiveInteger(value);
          break;
        case 'hour12':
          opt[name] = asBoolean(value);
          break;
        default:
          // @ts-expect-error Unknown options will be ignored
          opt[name] = asString(value);
      }
    } catch {
      const msg = `Value ${value} is not valid for :datetime option ${name}`;
      throw new MessageResolutionError('bad-option', msg, source);
    }
  }

  const date = value;
  let locale: string | undefined;
  let dtf: Intl.DateTimeFormat | undefined;
  let str: string | undefined;
  return {
    type: 'datetime',
    source,
    get locale() {
      return (locale ??= Intl.DateTimeFormat.supportedLocalesOf(lc, opt)[0]);
    },
    get options() {
      return { ...opt };
    },
    toParts() {
      dtf ??= new Intl.DateTimeFormat(lc, options);
      const parts = dtf.formatToParts(date);
      locale ??= dtf.resolvedOptions().locale;
      return [{ type: 'datetime', source, locale, parts }];
    },
    toString() {
      dtf ??= new Intl.DateTimeFormat(lc, options);
      str ??= dtf.format(date);
      return str;
    },
    valueOf: () => date
  };
}
