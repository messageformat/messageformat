import { MessageResolutionError } from '../errors.js';
import type { MessageExpressionPart } from '../formatted-parts.js';
import { getLocaleDir } from '../dir-utils.js';
import type { MessageFunctionContext, MessageValue } from './index.js';
import { asPositiveInteger, asString, mergeLocales } from './utils.js';

/** @beta */
export interface MessageNumber extends MessageValue {
  readonly type: 'number';
  readonly source: string;
  readonly dir: 'ltr' | 'rtl' | 'auto';
  readonly locale: string;
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

const INT = Symbol('INT');

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

/**
 * `number` accepts a number, BigInt or string representing a JSON number as input
 * and formats it with the same options as
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat | Intl.NumberFormat}.
 * It also supports plural category selection via
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules | Intl.PluralRules}.
 *
 * @beta
 */
export function number(
  ctx: MessageFunctionContext,
  exprOpt: Record<string | symbol, unknown>,
  operand?: unknown
): MessageNumber {
  const { source } = ctx;
  const options: Intl.NumberFormatOptions &
    Intl.PluralRulesOptions & { select?: 'exact' | 'cardinal' | 'ordinal' } = {
    localeMatcher: ctx.localeMatcher
  };
  const input = readNumericOperand(operand, source);
  const value = input.value;
  Object.assign(options, input.options);

  for (const [name, optval] of Object.entries(exprOpt)) {
    if (optval === undefined) continue;
    try {
      switch (name) {
        case 'locale':
        case 'type': // used internally by Intl.PluralRules, but called 'select' here
          break;
        case 'minimumIntegerDigits':
        case 'minimumFractionDigits':
        case 'maximumFractionDigits':
        case 'minimumSignificantDigits':
        case 'maximumSignificantDigits':
        case 'roundingIncrement':
          // @ts-expect-error TS types don't know about roundingIncrement
          options[name] = asPositiveInteger(optval);
          break;
        case 'useGrouping': {
          const strval = asString(optval);
          // @ts-expect-error TS type is wrong
          options[name] = strval === 'never' ? false : strval;
          break;
        }
        default:
          // @ts-expect-error Unknown options will be ignored
          options[name] = asString(optval);
      }
    } catch {
      const msg = `Value ${optval} is not valid for :number option ${name}`;
      ctx.onError(new MessageResolutionError('bad-option', msg, source));
    }
  }

  const num =
    Number.isFinite(value) && exprOpt[INT]
      ? Math.round(value as number)
      : value;

  const lc = mergeLocales(ctx.locales, operand, exprOpt);
  let locale: string | undefined;
  let dir = ctx.dir;
  let nf: Intl.NumberFormat | undefined;
  let cat: Intl.LDMLPluralRule | undefined;
  let str: string | undefined;
  return {
    type: 'number',
    source,
    get dir() {
      dir ??= getLocaleDir(this.locale);
      return dir;
    },
    get locale() {
      return (locale ??= Intl.NumberFormat.supportedLocalesOf(lc, options)[0]);
    },
    get options() {
      return { ...options };
    },
    selectKey(keys) {
      const str = String(num);
      if (keys.has(str)) return str;
      if (options.select === 'exact') return null;
      const pluralOpt = options.select
        ? { ...options, select: undefined, type: options.select }
        : options;
      // Intl.PluralRules needs a number, not bigint
      cat ??= new Intl.PluralRules(lc, pluralOpt).select(Number(num));
      return keys.has(cat) ? cat : null;
    },
    toParts() {
      nf ??= new Intl.NumberFormat(lc, options);
      const parts = nf.formatToParts(num);
      locale ??= nf.resolvedOptions().locale;
      dir ??= getLocaleDir(locale);
      return dir === 'ltr' || dir === 'rtl'
        ? [{ type: 'number', source, dir, locale, parts }]
        : [{ type: 'number', source, locale, parts }];
    },
    toString() {
      nf ??= new Intl.NumberFormat(lc, options);
      str ??= nf.format(num);
      return str;
    },
    valueOf: () => num
  };
}

/**
 * `integer` accepts a number, BigInt or string representing a JSON number as input
 * and formats it with the same options as
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat | Intl.NumberFormat}.
 * It also supports plural category selection via
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules | Intl.PluralRules}.
 *
 * The `maximumFractionDigits=0` and `style='decimal'` options are fixed for `:integer`.
 *
 * @beta
 */
export const integer = (
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  input?: unknown
) =>
  number(
    ctx,
    { ...options, maximumFractionDigits: 0, style: 'decimal', [INT]: true },
    input
  );
