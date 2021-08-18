import type { Runtime, RuntimeOptions } from '../data-model';

export const runtime: Runtime<string> = {
  select: { plural },
  format: { datetime, number }
};

export function datetime(
  locales: string[],
  options: RuntimeOptions | undefined,
  arg: unknown
) {
  const d =
    typeof arg === 'number' || arg instanceof Date
      ? arg
      : new Date(String(arg));
  const dtf = new Intl.DateTimeFormat(locales, options);
  return dtf.format(d);
}

export function number(
  locales: string[],
  options: RuntimeOptions | undefined,
  arg: unknown
) {
  const nf = new Intl.NumberFormat(locales, options);
  return nf.format(Number(arg));
}

export function plural(
  locales: string[],
  options: RuntimeOptions | undefined,
  arg: unknown
) {
  const n = Number(arg);
  const pr = new Intl.PluralRules(locales, options);
  return [n, pr.select(n)];
}
