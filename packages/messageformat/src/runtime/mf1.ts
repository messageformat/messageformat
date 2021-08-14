import {
  date as dateFmt,
  duration as durationFmt,
  numberFmt,
  time as timeFmt
} from '@messageformat/runtime/lib/formatters';
import type { FunctionOptions, Runtime } from '../data-model';
import type { FormattedPart } from '../format-message';

export const runtime: Runtime<string> = {
  select: { plural },
  format: { date, duration, number, time }
};

function asLiteral(fmt: FormattedPart) {
  const x = fmt.valueOf();
  return typeof x === 'number' || typeof x === 'string' ? x : String(x);
}

const getParam = (options: FunctionOptions | undefined) =>
  (options && String(options.param).trim()) || undefined;

type DateTimeSize = 'short' | 'default' | 'long' | 'full';

export function date(
  locales: string[],
  options: FunctionOptions | undefined,
  arg: FormattedPart
) {
  return dateFmt(asLiteral(arg), locales, getParam(options) as DateTimeSize);
}

export function duration(
  _locales: string[],
  _options: FunctionOptions | undefined,
  arg: FormattedPart
) {
  return durationFmt(asLiteral(arg));
}

export function number(
  locales: string[],
  options: FunctionOptions | undefined,
  arg: FormattedPart
) {
  let n = Number(arg.valueOf());
  const offset = Number(options && options.pluralOffset);
  if (Number.isFinite(offset)) n -= offset;
  return numberFmt(n, locales, getParam(options) || '', 'USD');
}

export function plural(
  locales: string[],
  options: FunctionOptions | undefined,
  arg: FormattedPart
) {
  const n = Number(arg.valueOf());
  if (!Number.isFinite(n)) return n;
  const offset = Number(options && options.pluralOffset);
  const pr = new Intl.PluralRules(locales, options);
  const cat = pr.select(Number.isFinite(offset) ? n - offset : n);
  return [n, cat];
}

export function time(
  locales: string[],
  options: FunctionOptions | undefined,
  arg: FormattedPart
) {
  return timeFmt(asLiteral(arg), locales, getParam(options) as DateTimeSize);
}
