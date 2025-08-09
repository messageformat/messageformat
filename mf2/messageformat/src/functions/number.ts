import { getLocaleDir } from '../dir-utils.ts';
import { MessageFunctionError } from '../errors.ts';
import type { MessageExpressionPart } from '../formatted-parts.ts';
import type { MessageValue } from '../message-value.ts';
import type { MessageFunctionContext } from '../resolve/function-context.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { DefaultFunctions, DraftFunctions } from './index.ts';
import { asPositiveInteger, asString } from './utils.ts';

/**
 * The resolved value of a
 * {@link DraftFunctions.currency | :currency},
 * {@link DefaultFunctions.integer | :integer},
 * {@link DefaultFunctions.number | :number},
 * {@link DefaultFunctions.offset | :offset},
 * or {@link DraftFunctions.unit | :unit} expression.
 */
export interface MessageNumber extends MessageValue<'number'> {
  readonly type: 'number';
  readonly dir: 'ltr' | 'rtl' | 'auto';
  readonly options: Readonly<
    Intl.NumberFormatOptions & Intl.PluralRulesOptions
  >;

  /**
   * In addition to matching exact values,
   * numerical values may also match keys with the same plural rule category,
   * i.e. one of `zero`, `one`, `two`, `few`, `many`, and `other`.
   *
   * Different languages use different subset of plural rule categories.
   * For example, cardinal English plurals only use `one` and `other`,
   * so a key `zero` will never be matched for that locale.
   */
  selectKey?: (keys: Set<string>) => string | null;
  toParts?: () => [MessageNumberPart];
  toString?: () => string;
  valueOf(): number | bigint;
}

/**
 * The formatted part for a {@link MessageNumber} value.
 *
 * @category Formatted Parts
 */
export interface MessageNumberPart extends MessageExpressionPart<'number'> {
  type: 'number';
  locale: string;
  parts: Intl.NumberFormatPart[];
}

export type MessageNumberOptions = Intl.NumberFormatOptions &
  Intl.PluralRulesOptions & { select?: 'exact' | 'cardinal' | 'ordinal' };

export function readNumericOperand(value: unknown): {
  value: number | bigint;
  options: unknown;
} {
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
    throw new MessageFunctionError('bad-operand', 'Input is not numeric');
  }
  return { value, options };
}

export function getMessageNumber(
  ctx: MessageFunctionContext,
  value: number | bigint,
  options: MessageNumberOptions,
  canSelect: boolean
): MessageNumber {
  let { dir, locales } = ctx;
  // @ts-expect-error We may have been a bit naughty earlier.
  if (options.useGrouping === 'never') options.useGrouping = false;
  if (
    canSelect &&
    'select' in options &&
    !ctx.literalOptionKeys.has('select')
  ) {
    ctx.onError(
      'bad-option',
      'The option select may only be set by a literal value'
    );
    canSelect = false;
  }

  let locale: string | undefined;
  let nf: Intl.NumberFormat | undefined;
  let cat: Intl.LDMLPluralRule | undefined;
  let str: string | undefined;
  return {
    type: 'number',
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
    selectKey: canSelect
      ? keys => {
          const str = String(value);
          if (keys.has(str)) return str;
          if (options.select === 'exact') return null;
          const pluralOpt = options.select
            ? { ...options, select: undefined, type: options.select }
            : options;
          // Intl.PluralRules needs a number, not bigint
          cat ??= new Intl.PluralRules(locales, pluralOpt).select(
            Number(value)
          );
          return keys.has(cat) ? cat : null;
        }
      : undefined,
    toParts() {
      nf ??= new Intl.NumberFormat(locales, options);
      const parts = nf.formatToParts(value);
      locale ??= nf.resolvedOptions().locale;
      dir ??= getLocaleDir(locale);
      return dir === 'ltr' || dir === 'rtl'
        ? [{ type: 'number', dir, locale, parts }]
        : [{ type: 'number', locale, parts }];
    },
    toString() {
      nf ??= new Intl.NumberFormat(locales, options);
      str ??= nf.format(value);
      return str;
    },
    valueOf: () => value
  };
}

export function number(
  ctx: MessageFunctionContext,
  exprOpt: Record<string, unknown>,
  operand?: unknown
): MessageNumber {
  const input = readNumericOperand(operand);
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
      ctx.onError(
        'bad-option',
        `Value ${optval} is not valid for :number option ${name}`
      );
    }
  }

  return getMessageNumber(ctx, value, options, true);
}

export function integer(
  ctx: MessageFunctionContext,
  exprOpt: Record<string, unknown>,
  operand?: unknown
) {
  const input = readNumericOperand(operand);
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
      ctx.onError(
        'bad-option',
        `Value ${optval} is not valid for :integer option ${name}`
      );
    }
  }

  return getMessageNumber(ctx, value, options, true);
}
