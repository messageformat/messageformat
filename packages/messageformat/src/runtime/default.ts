import type { FunctionOptions, Runtime } from '../data-model';
import type { FormattedPart } from '../format-message';

export const runtime: Runtime<string> = {
  select: { plural },
  format: { datetime, number }
};

export function datetime(
  locales: string[],
  options: FunctionOptions | undefined,
  arg: FormattedPart
) {
  const value = arg.valueOf();
  const d =
    typeof value === 'number' || value instanceof Date
      ? value
      : new Date(String(value));
  const dtf = new Intl.DateTimeFormat(locales, options);
  return dtf.format(d);
}

export function number(
  locales: string[],
  options: FunctionOptions | undefined,
  arg: FormattedPart
) {
  const nf = new Intl.NumberFormat(locales, options);
  return nf.format(Number(arg.valueOf()));
}

export function plural(
  locales: string[],
  options: FunctionOptions | undefined,
  arg: FormattedPart
) {
  const n = Number(arg.valueOf());
  const pr = new Intl.PluralRules(locales, options);
  return [n, pr.select(n)];
}
