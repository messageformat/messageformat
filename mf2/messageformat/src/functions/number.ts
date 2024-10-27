import { MessageResolutionError } from '../errors.js';
import type { MessageExpressionPart } from '../formatted-parts.js';
import { getLocaleDir } from '../dir-utils.js';
import type { MessageFunctionContext, MessageValue } from './index.js';
import {
  asBoolean,
  asPositiveInteger,
  asString,
  mergeLocales
} from './utils.js';

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
  options: Record<string | symbol, unknown>,
  input?: unknown
): MessageNumber {
  const { source } = ctx;
  const opt: Intl.NumberFormatOptions &
    Intl.PluralRulesOptions & { select?: 'exact' | 'cardinal' | 'ordinal' } = {
    localeMatcher: ctx.localeMatcher
  };
  let value = input;
  if (typeof value === 'object') {
    const valueOf = value?.valueOf;
    if (typeof valueOf === 'function') {
      Object.assign(opt, (value as { options: unknown }).options);
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
  for (const [name, optval] of Object.entries(options)) {
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
          opt[name] = asPositiveInteger(optval);
          break;
        case 'useGrouping':
          opt[name] = asBoolean(optval);
          break;
        default:
          // @ts-expect-error Unknown options will be ignored
          opt[name] = asString(optval);
      }
    } catch {
      const msg = `Value ${optval} is not valid for :number option ${name}`;
      throw new MessageResolutionError('bad-option', msg, source);
    }
  }

  const num =
    Number.isFinite(value) && options[INT]
      ? Math.round(value as number)
      : value;

  const lc = mergeLocales(ctx.locales, input, options);
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
      return (locale ??= Intl.NumberFormat.supportedLocalesOf(lc, opt)[0]);
    },
    get options() {
      return { ...opt };
    },
    selectKey(keys) {
      const str = String(num);
      if (keys.has(str)) return str;
      if (opt.select === 'exact') return null;
      const pluralOpt = opt.select
        ? { ...opt, select: undefined, type: opt.select }
        : opt;
      // Intl.PluralRules needs a number, not bigint
      cat ??= new Intl.PluralRules(lc, pluralOpt).select(Number(num));
      return keys.has(cat) ? cat : null;
    },
    toParts() {
      nf ??= new Intl.NumberFormat(lc, opt);
      const parts = nf.formatToParts(num);
      locale ??= nf.resolvedOptions().locale;
      dir ??= getLocaleDir(locale);
      return dir === 'ltr' || dir === 'rtl'
        ? [{ type: 'number', source, dir, locale, parts }]
        : [{ type: 'number', source, locale, parts }];
    },
    toString() {
      nf ??= new Intl.NumberFormat(lc, opt);
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
