import {
  date as dateFmt,
  duration as durationFmt,
  numberFmt,
  time as timeFmt
} from '@messageformat/runtime/lib/formatters';
import { FunctionOptions, Runtime } from '../data-model';

export const runtime: Runtime<string> = {
  select: { plural },
  format: { date, duration, number, time }
};

const asLiteral = (x: unknown) =>
  typeof x === 'number' || typeof x === 'string' ? x : String(x);

const getParam = (options: FunctionOptions) =>
  (options && String(options.param).trim()) || undefined;

type DateTimeSize = 'short' | 'default' | 'long' | 'full';

export function date(
  locales: string[],
  options: FunctionOptions,
  arg: unknown
) {
  return dateFmt(asLiteral(arg), locales, getParam(options) as DateTimeSize);
}

export function duration(
  _locales: string[],
  _options: FunctionOptions,
  arg: unknown
) {
  return durationFmt(asLiteral(arg));
}

export function number(
  locales: string[],
  options: FunctionOptions,
  arg: unknown
) {
  let n = Number(arg);
  const offset = Number(options && options.pluralOffset);
  if (Number.isFinite(offset)) n -= offset;
  return numberFmt(n, locales, getParam(options) || '', 'USD');
}

export function plural(
  locales: string[],
  options: FunctionOptions,
  arg: unknown
) {
  const n = Number(arg);
  if (!Number.isFinite(n)) return n;
  const offset = Number(options && options.pluralOffset);
  try {
    const pr = new Intl.PluralRules(locales, options);
    const cat = pr.select(Number.isFinite(offset) ? n - offset : n);
    return [n, cat];
  } catch (_) {
    return n;
  }
}

export function time(
  locales: string[],
  options: FunctionOptions,
  arg: unknown
) {
  return timeFmt(asLiteral(arg), locales, getParam(options) as DateTimeSize);
}
