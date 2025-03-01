import { getLocaleDir } from '../dir-utils.js';
import { MessageResolutionError } from '../errors.js';
import type { MessageExpressionPart } from '../formatted-parts.js';
import type { MessageValue } from '../message-value.js';
import type { MessageFunctionContext } from '../resolve/function-context.js';
import { asPositiveInteger, asString } from './utils.js';

/** @beta */
export interface MessageNumber extends MessageValue {
  readonly type: 'number';
  readonly source: string;
  readonly dir: 'ltr' | 'rtl' | 'auto';
  readonly options: Readonly<
    Intl.NumberFormatOptions & Intl.PluralRulesOptions
  >;
  /**
   * In addition to matching exact values,
   * numerical values may also match keys with the same plural rule category,
   * i.e. one of `zero`, `one`, `two`, `few`, `many`, and `other`.
   *
   * @remarks
   * Different languages use different subset of plural rule categories.
   * For example, cardinal English plurals only use `one` and `other`,
   * so a key `zero` will never be matched for that locale.
   */
  selectKey(keys: Set<string>): string | null;
  toParts?: () => [MessageNumberPart];
  toString?: () => string;
  valueOf(): number | bigint;
}

/** @beta */
export interface MessageNumberPart extends MessageExpressionPart {
  type: 'number';
  source: string;
  locale: string;
  parts: Intl.NumberFormatPart[];
}

export type MessageNumberOptions = Intl.NumberFormatOptions &
  Intl.PluralRulesOptions & { select?: 'exact' | 'cardinal' | 'ordinal' };

export function readNumericOperand(
  value: unknown,
  source: string
): { value: number | bigint; options: unknown } {
  let options: unknown = undefined;
  if (typeof value === 'object') {
    const valueOf = value?.valueOf;
    if (typeof valueOf === 'function') {
      options = (value as { options: unknown }).options;
      value = valueOf.call(value);
    }
  }
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      // handled below
    }
  }
  if (typeof value !== 'bigint' && typeof value !== 'number') {
    const msg = 'Input is not numeric';
    throw new MessageResolutionError('bad-operand', msg, source);
  }
  return { value, options };
}

export function getMessageNumber(
  { dir, locales, source }: MessageFunctionContext,
  value: number | bigint,
  options: MessageNumberOptions
): MessageNumber {
  // @ts-expect-error We may have been a bit naughty earlier.
  if (options.useGrouping === 'never') options.useGrouping = false;

  let locale: string | undefined;
  let nf: Intl.NumberFormat | undefined;
  let cat: Intl.LDMLPluralRule | undefined;
  let str: string | undefined;
  return {
    type: 'number',
    source,
    get dir() {
      if (dir == null) {
        locale ??= Intl.NumberFormat.supportedLocalesOf(locales, options)[0];
        dir = getLocaleDir(locale);
      }
      return dir;
    },
    get options() {
      return { ...options };
    },
    selectKey(keys) {
      const str = String(value);
      if (keys.has(str)) return str;
      if (options.select === 'exact') return null;
      const pluralOpt = options.select
        ? { ...options, select: undefined, type: options.select }
        : options;
      // Intl.PluralRules needs a number, not bigint
      cat ??= new Intl.PluralRules(locales, pluralOpt).select(Number(value));
      return keys.has(cat) ? cat : null;
    },
    toParts() {
      nf ??= new Intl.NumberFormat(locales, options);
      const parts = nf.formatToParts(value);
      locale ??= nf.resolvedOptions().locale;
      dir ??= getLocaleDir(locale);
      return dir === 'ltr' || dir === 'rtl'
        ? [{ type: 'number', source, dir, locale, parts }]
        : [{ type: 'number', source, locale, parts }];
    },
    toString() {
      nf ??= new Intl.NumberFormat(locales, options);
      str ??= nf.format(value);
      return str;
    },
    valueOf: () => value
  };
}

/**
 * `number` accepts a number, BigInt or string representing a JSON number as input
 * and formats it with a subset of the options of
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat | Intl.NumberFormat}.
 * It also supports plural category selection via
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules | Intl.PluralRules}.
 *
 * @beta
 */
export function number(
  ctx: MessageFunctionContext,
  exprOpt: Record<string, unknown>,
  operand?: unknown
): MessageNumber {
  const input = readNumericOperand(operand, ctx.source);
  const value = input.value;
  const options: MessageNumberOptions = Object.assign({}, input.options, {
    localeMatcher: ctx.localeMatcher,
    style: 'decimal'
  } as const);

  for (const [name, optval] of Object.entries(exprOpt)) {
    if (optval === undefined) continue;
    try {
      switch (name) {
        case 'minimumIntegerDigits':
        case 'minimumFractionDigits':
        case 'maximumFractionDigits':
        case 'minimumSignificantDigits':
        case 'maximumSignificantDigits':
        case 'roundingIncrement':
          // @ts-expect-error TS types don't know about roundingIncrement
          options[name] = asPositiveInteger(optval);
          break;
        case 'roundingMode':
        case 'roundingPriority':
        case 'select': // Called 'type' in Intl.PluralRules
        case 'signDisplay':
        case 'trailingZeroDisplay':
        case 'useGrouping':
          // @ts-expect-error Let Intl.NumberFormat construction fail
          options[name] = asString(optval);
      }
    } catch {
      const msg = `Value ${optval} is not valid for :number option ${name}`;
      ctx.onError(new MessageResolutionError('bad-option', msg, ctx.source));
    }
  }

  return getMessageNumber(ctx, value, options);
}

/**
 * `integer` accepts a number, BigInt or string representing a JSON number as input
 * and formats it with a subset of the options of
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat | Intl.NumberFormat}.
 * It also supports plural category selection via
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules | Intl.PluralRules}.
 *
 * @beta
 */
export function integer(
  ctx: MessageFunctionContext,
  exprOpt: Record<string, unknown>,
  operand?: unknown
) {
  const input = readNumericOperand(operand, ctx.source);
  const value = Number.isFinite(input.value)
    ? Math.round(input.value as number)
    : input.value;
  const options: MessageNumberOptions = Object.assign({}, input.options, {
    //localeMatcher: ctx.localeMatcher,
    maximumFractionDigits: 0,
    minimumFractionDigits: undefined,
    minimumSignificantDigits: undefined,
    style: 'decimal'
  } as const);

  for (const [name, optval] of Object.entries(exprOpt)) {
    if (optval === undefined) continue;
    try {
      switch (name) {
        case 'minimumIntegerDigits':
        case 'maximumSignificantDigits':
          options[name] = asPositiveInteger(optval);
          break;
        case 'select': // Called 'type' in Intl.PluralRules
        case 'signDisplay':
        case 'useGrouping':
          // @ts-expect-error Let Intl.NumberFormat construction fail
          options[name] = asString(optval);
      }
    } catch {
      const msg = `Value ${optval} is not valid for :integer option ${name}`;
      ctx.onError(new MessageResolutionError('bad-option', msg, ctx.source));
    }
  }

  return getMessageNumber(ctx, value, options);
}
