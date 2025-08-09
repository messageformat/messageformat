import { getLocaleDir } from '../dir-utils.ts';
import { MessageFunctionError } from '../errors.ts';
import type { MessageExpressionPart } from '../formatted-parts.ts';
import type { MessageValue } from '../message-value.ts';
import type { MessageFunctionContext } from '../resolve/function-context.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { DraftFunctions } from './index.ts';
import { asBoolean, asString } from './utils.ts';

/**
 * The resolved value of a {@link DraftFunctions.date | :date},
 * {@link DraftFunctions.datetime | :datetime}, or {@link DraftFunctions.time | :time} expression.
 *
 * @beta
 */
export interface MessageDateTime extends MessageValue<'datetime'> {
  readonly type: 'datetime';
  readonly dir: 'ltr' | 'rtl' | 'auto';
  readonly options: Readonly<Intl.DateTimeFormatOptions>;
  toParts(): [MessageDateTimePart];
  toString(): string;
  valueOf(): Date;
}

/**
 * The formatted part for a {@link MessageDateTime} value.
 *
 * @beta
 * @category Formatted Parts
 */
export interface MessageDateTimePart extends MessageExpressionPart<'datetime'> {
  type: 'datetime';
  locale: string;
  parts: Intl.DateTimeFormatPart[];
}

const dateFieldsValues = new Set([
  'weekday',
  'day-weekday',
  'month-day',
  'month-day-weekday',
  'year-month-day',
  'year-month-day-weekday'
] as const);
const dateLengthValues = new Set(['long', 'medium', 'short'] as const);
const timePrecisionValues = new Set(['hour', 'minute', 'second'] as const);
const timeZoneStyleValues = new Set(['long', 'short'] as const);

/**
 * The function `:datetime` is used to format a date/time value.
 * Its formatted result will always include both the date and the time, and optionally a timezone.
 *
 * @beta
 */
export const datetime = (
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  operand?: unknown
) => dateTimeImplementation('datetime', ctx, options, operand);

/**
 * The function `:date` is used to format the date portion of date/time values.
 *
 * @beta
 */
export const date = (
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  operand?: unknown
) => dateTimeImplementation('date', ctx, options, operand);

/**
 * The function `:time` is used to format the time portion of date/time values.
 * Its formatted result will always include the time, and optionally a timezone.
 *
 * @beta
 */
export const time = (
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  operand?: unknown
) => dateTimeImplementation('time', ctx, options, operand);

function dateTimeImplementation(
  functionName: 'datetime' | 'date' | 'time',
  ctx: MessageFunctionContext,
  exprOpt: Record<string, unknown>,
  operand?: unknown
): MessageDateTime {
  const options: Intl.DateTimeFormatOptions = {
    localeMatcher: ctx.localeMatcher
  };

  let value = operand;
  if (typeof value === 'object' && value !== null) {
    const opt = (value as { options?: Intl.DateTimeFormatOptions }).options;
    if (opt) {
      options.calendar = opt.calendar;
      if (functionName !== 'date') options.hour12 = opt.hour12;
      options.timeZone = opt.timeZone;
    }
    if (typeof value.valueOf === 'function') value = value.valueOf();
  }

  switch (typeof value) {
    case 'number':
    case 'string':
      value = new Date(value);
  }
  if (!(value instanceof Date) || isNaN(value.getTime())) {
    throw new MessageFunctionError('bad-operand', 'Input is not a valid date');
  }

  // Override options
  if (exprOpt.calendar !== undefined) {
    try {
      options.calendar = asString(exprOpt.calendar);
    } catch {
      ctx.onError(
        'bad-option',
        `Invalid :${functionName} calendar option value`
      );
    }
  }
  if (exprOpt.hour12 !== undefined && functionName !== 'date') {
    try {
      options.hour12 = asBoolean(exprOpt.hour12);
    } catch {
      ctx.onError('bad-option', `Invalid :${functionName} hour12 option value`);
    }
  }
  if (exprOpt.timeZone !== undefined) {
    let tz: string | undefined;
    try {
      tz = asString(exprOpt.timeZone);
    } catch {
      ctx.onError(
        'bad-option',
        `Invalid :${functionName} timeZone option value`
      );
    }
    if (tz === 'input') {
      if (options.timeZone === undefined) {
        ctx.onError(
          'bad-operand',
          `Missing input timeZone value for :${functionName}`
        );
      }
    } else if (tz !== undefined) {
      if (options.timeZone !== undefined && tz !== options.timeZone) {
        // Use fallback value for expression
        throw new MessageFunctionError(
          'bad-option',
          'Time zone conversion is not supported'
        );
      }
      options.timeZone = tz;
    }
  }

  // Date formatting options
  if (functionName !== 'time') {
    const dfName = functionName === 'date' ? 'fields' : 'dateFields';
    const dlName = functionName === 'date' ? 'length' : 'dateLength';
    const dateFieldsValue =
      readStringOption(ctx, exprOpt, dfName, dateFieldsValues) ??
      'year-month-day';
    const dateLength = readStringOption(ctx, exprOpt, dlName, dateLengthValues);

    const dateFields = new Set(dateFieldsValue.split('-'));
    if (dateFields.has('year')) options.year = 'numeric';
    if (dateFields.has('month')) {
      options.month =
        dateLength === 'long'
          ? 'long'
          : dateLength === 'short'
            ? 'numeric'
            : 'short';
    }
    if (dateFields.has('day')) options.day = 'numeric';
    if (dateFields.has('weekday')) {
      options.weekday = dateLength === 'long' ? 'long' : 'short';
    }
  }

  // Time formatting options
  if (functionName !== 'date') {
    const tpName = functionName === 'time' ? 'precision' : 'timePrecision';
    switch (readStringOption(ctx, exprOpt, tpName, timePrecisionValues)) {
      case 'hour':
        options.hour = 'numeric';
        break;
      case 'second':
        options.hour = 'numeric';
        options.minute = 'numeric';
        options.second = 'numeric';
        break;
      default:
        options.hour = 'numeric';
        options.minute = 'numeric';
    }

    options.timeZoneName = readStringOption(
      ctx,
      exprOpt,
      'timeZoneStyle',
      timeZoneStyleValues
    );
  }

  // Resolved value
  const dtf = new Intl.DateTimeFormat(ctx.locales, options);
  let dir = ctx.dir;
  let locale: string | undefined;
  let str: string | undefined;
  return {
    type: 'datetime',
    get dir() {
      if (dir == null) {
        locale ??= dtf.resolvedOptions().locale;
        dir = getLocaleDir(locale);
      }
      return dir;
    },
    get options() {
      return { ...options };
    },
    toParts() {
      const parts = dtf.formatToParts(value);
      locale ??= dtf.resolvedOptions().locale;
      dir ??= getLocaleDir(locale);
      return dir === 'ltr' || dir === 'rtl'
        ? [{ type: 'datetime', dir, locale, parts }]
        : [{ type: 'datetime', locale, parts }];
    },
    toString() {
      str ??= dtf.format(value);
      return str;
    },
    valueOf: () => value
  };
}

function readStringOption<T extends string>(
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  name: string,
  allowed: Set<T> | undefined
): T | undefined {
  const value = options[name];
  if (value !== undefined) {
    try {
      const str = asString(value) as T;
      if (allowed && !allowed.has(str)) throw Error();
      return str;
    } catch {
      ctx.onError('bad-option', `Invalid value for ${name} option`);
    }
  }
  return undefined;
}
