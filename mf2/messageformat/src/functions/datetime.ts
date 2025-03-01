import { getLocaleDir } from '../dir-utils.js';
import { MessageResolutionError } from '../errors.js';
import type { MessageExpressionPart } from '../formatted-parts.js';
import type { MessageValue } from '../message-value.js';
import type { MessageFunctionContext } from '../resolve/function-context.js';
import { asBoolean, asPositiveInteger, asString } from './utils.js';

/** @beta */
export interface MessageDateTime extends MessageValue {
  readonly type: 'datetime';
  readonly source: string;
  readonly dir: 'ltr' | 'rtl' | 'auto';
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

const styleOptions = new Set(['dateStyle', 'timeStyle']);
const fieldOptions = new Set([
  'weekday',
  'era',
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'fractionalSecondDigits',
  'timeZoneName'
]);

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
  dateTimeImplementation(ctx, input, res => {
    let hasStyle = false;
    let hasFields = false;
    for (const [name, value] of Object.entries(options)) {
      if (value === undefined) continue;
      try {
        switch (name) {
          case 'locale':
            break;
          case 'fractionalSecondDigits':
            res[name] = asPositiveInteger(value);
            hasFields = true;
            break;
          case 'hour12':
            res[name] = asBoolean(value);
            break;
          default:
            res[name] = asString(value);
            if (!hasStyle && styleOptions.has(name)) hasStyle = true;
            if (!hasFields && fieldOptions.has(name)) hasFields = true;
        }
      } catch {
        const msg = `Value ${value} is not valid for :datetime ${name} option`;
        ctx.onError(new MessageResolutionError('bad-option', msg, ctx.source));
      }
    }
    if (!hasStyle && !hasFields) {
      res.dateStyle = 'medium';
      res.timeStyle = 'short';
    } else if (hasStyle && hasFields) {
      const msg = 'Style and field options cannot be both set for :datetime';
      throw new MessageResolutionError('bad-option', msg, ctx.source);
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
  dateTimeImplementation(ctx, input, res => {
    for (const name of Object.keys(res)) {
      if (styleOptions.has(name) || fieldOptions.has(name)) delete res[name];
    }
    for (const [name, value] of Object.entries(options)) {
      if (value === undefined) continue;
      try {
        switch (name) {
          case 'style':
            res.dateStyle = asString(value);
            break;
          case 'hour12':
            res[name] = asBoolean(value);
            break;
          case 'calendar':
          case 'timeZone':
            res[name] = asString(value);
        }
      } catch {
        const msg = `Value ${value} is not valid for :date ${name} option`;
        ctx.onError(new MessageResolutionError('bad-option', msg, ctx.source));
      }
    }
    res.dateStyle ??= 'medium';
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
  dateTimeImplementation(ctx, input, res => {
    for (const name of Object.keys(res)) {
      if (styleOptions.has(name) || fieldOptions.has(name)) delete res[name];
    }
    for (const [name, value] of Object.entries(options)) {
      if (value === undefined) continue;
      try {
        switch (name) {
          case 'style':
            res.timeStyle = asString(value);
            break;
          case 'hour12':
            res[name] = asBoolean(value);
            break;
          case 'calendar':
          case 'timeZone':
            res[name] = asString(value);
        }
      } catch {
        const msg = `Value ${value} is not valid for :time ${name} option`;
        ctx.onError(new MessageResolutionError('bad-option', msg, ctx.source));
      }
    }
    res.timeStyle ??= 'short';
  });

function dateTimeImplementation(
  ctx: MessageFunctionContext,
  input: unknown,
  parseOptions: (res: Record<string, unknown>) => void
): MessageDateTime {
  const { localeMatcher, locales, source } = ctx;
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
  let dir = ctx.dir;
  let dtf: Intl.DateTimeFormat | undefined;
  let str: string | undefined;
  return {
    type: 'datetime',
    source,
    get dir() {
      if (dir == null) {
        locale ??= Intl.DateTimeFormat.supportedLocalesOf(locales, opt)[0];
        dir = getLocaleDir(locale);
      }
      return dir;
    },
    get options() {
      return { ...opt };
    },
    toParts() {
      dtf ??= new Intl.DateTimeFormat(locales, opt);
      const parts = dtf.formatToParts(date);
      locale ??= dtf.resolvedOptions().locale;
      dir ??= getLocaleDir(locale);
      return dir === 'ltr' || dir === 'rtl'
        ? [{ type: 'datetime', source, dir, locale, parts }]
        : [{ type: 'datetime', source, locale, parts }];
    },
    toString() {
      dtf ??= new Intl.DateTimeFormat(locales, opt);
      str ??= dtf.format(date);
      return str;
    },
    valueOf: () => date
  };
}
