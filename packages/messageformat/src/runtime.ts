import { FunctionOptions } from './data-model';

export function number(
  locales: string[],
  options: FunctionOptions,
  arg: unknown
) {
  const nf = new Intl.NumberFormat(locales, options);
  return nf.format(Number(arg));
}

export function plural(
  locales: string[],
  options: FunctionOptions,
  arg: unknown
): (number | Intl.LDMLPluralRule)[] {
  const n = Number(arg);
  if (!Number.isFinite(n)) return ['other']
  const offset = Number(options && options.pluralOffset);
  const pr = new Intl.PluralRules(locales, options);
  const cat = pr.select(Number.isFinite(offset) ? n - offset : n)
  return cat === 'other' ? [n, cat] : [n, cat, 'other']
}
