import { MessageResolutionError } from '../errors.js';
import type { MessageExpressionPart } from '../formatted-parts.js';
import type { MessageFunctionContext, MessageValue } from './index.js';
import {
  asBoolean,
  asPositiveInteger,
  asString,
  mergeLocales
} from './utils.js';

/** @beta */
export interface MessageDateTime extends MessageValue {
  readonly type: 'datetime';
  readonly source: string;
  readonly locale: string;
  readonly options: Readonly<Intl.DateTimeFormatOptions>;
  toParts(): [MessageDateTimePart];
  toString(): string;
  valueOf(): Date;
}

/** @beta */
export interface MessageDateTimePart extends MessageExpressionPart {
  type: 'datetime';
  source: string;
  locale: string;
  parts: Intl.DateTimeFormatPart[];
}

const localeOptions = [
  'calendar',
  'localeMatcher',
  'hour12',
  'hourCycle',
  'numberingSystem',
  'timeZone'
];

/**
 * `datetime` accepts a Date, number or string as its input
 * and formats it with the same options as
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat | Intl.DateTimeFormat}.
 *
 * @beta
 */
export const datetime = (
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  input?: unknown
): MessageDateTime =>
  dateTimeImplementation(ctx, options, input, res => {
    for (const [name, value] of Object.entries(options)) {
      if (value === undefined) continue;
      try {
        switch (name) {
          case 'locale':
            break;
          case 'fractionalSecondDigits':
            res[name] = asPositiveInteger(value);
            break;
          case 'hour12':
            res[name] = asBoolean(value);
            break;
          default:
            res[name] = asString(value);
        }
      } catch {
        const msg = `Value ${value} is not valid for :datetime option ${name}`;
        throw new MessageResolutionError('bad-option', msg, ctx.source);
      }
    }

    // Set defaults if localeMatcher is the only option
    if (Object.keys(res).length <= 1) {
      res.dateStyle = 'short';
      res.timeStyle = 'short';
    }
  });

/**
 * `date` accepts a Date, number or string as its input
 * and formats it according to a single "style" option.
 *
 * @beta
 */
export const date = (
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  input?: unknown
): MessageDateTime =>
  dateTimeImplementation(ctx, options, input, res => {
    const ds = options.style ?? res.dateStyle ?? 'short';
    for (const name of Object.keys(res)) {
      if (!localeOptions.includes(name)) delete res[name];
    }
    try {
      res.dateStyle = asString(ds);
    } catch {
      const msg = `Value ${ds} is not valid for :date style option`;
      throw new MessageResolutionError('bad-option', msg, ctx.source);
    }
  });

/**
 * `time` accepts a Date, number or string as its input
 * and formats it according to a single "style" option.
 *
 * @beta
 */
export const time = (
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  input?: unknown
): MessageDateTime =>
  dateTimeImplementation(ctx, options, input, res => {
    const ts = options.style ?? res.timeStyle ?? 'short';
    for (const name of Object.keys(res)) {
      if (!localeOptions.includes(name)) delete res[name];
    }
    try {
      res.timeStyle = asString(ts);
    } catch {
      const msg = `Value ${ts} is not valid for :time style option`;
      throw new MessageResolutionError('bad-option', msg, ctx.source);
    }
  });

function dateTimeImplementation(
  { localeMatcher, locales, source }: MessageFunctionContext,
  options: Record<string, unknown>,
  input: unknown,
  parseOptions: (res: Record<string, unknown>) => void
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
  }
  if (!(value instanceof Date) || isNaN(value.getTime())) {
    const msg = 'Input is not a date';
    throw new MessageResolutionError('bad-operand', msg, source);
  }

  parseOptions(opt as Record<string, unknown>);

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
      dtf ??= new Intl.DateTimeFormat(lc, opt);
      const parts = dtf.formatToParts(date);
      locale ??= dtf.resolvedOptions().locale;
      return [{ type: 'datetime', source, locale, parts }];
    },
    toString() {
      dtf ??= new Intl.DateTimeFormat(lc, opt);
      str ??= dtf.format(date);
      return str;
    },
    valueOf: () => date
  };
}
