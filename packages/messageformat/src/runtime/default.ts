import type { FunctionOptions, Runtime } from '../data-model';

export const runtime: Runtime<string> = {
  select: { plural },
  format: { datetime, number }
};

export function datetime(
  locales: string[],
  options: FunctionOptions,
  arg: unknown
) {
  const d =
    typeof arg === 'number' || arg instanceof Date
      ? arg
      : new Date(String(arg));
  try {
    const dtf = new Intl.DateTimeFormat(locales, options);
    return dtf.format(d);
  } catch (_) {
    return String(d);
  }
}

export function number(
  locales: string[],
  options: FunctionOptions,
  arg: unknown
) {
  try {
    const nf = new Intl.NumberFormat(locales, options);
    return nf.format(Number(arg));
  } catch (_) {
    return String(arg);
  }
}

export function plural(
  locales: string[],
  options: FunctionOptions,
  arg: unknown
) {
  const n = Number(arg);
  try {
    const pr = new Intl.PluralRules(locales, options);
    return [n, pr.select(n)];
  } catch (_) {
    return n;
  }
}
