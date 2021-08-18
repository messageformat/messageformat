import {
  date as dateFmt,
  duration as durationFmt,
  numberFmt,
  time as timeFmt
} from '@messageformat/runtime/lib/formatters';
import type { Runtime, RuntimeOptions } from '../data-model';

export const runtime: Runtime<string> = {
  select: { plural },
  format: { date, duration, number, time }
};

const asLiteral = (arg: unknown) =>
  typeof arg === 'number' || typeof arg === 'string' ? arg : String(arg);

const getParam = (options: RuntimeOptions | undefined) =>
  (options && String(options.param).trim()) || undefined;

type DateTimeSize = 'short' | 'default' | 'long' | 'full';

export function date(
  locales: string[],
  options: RuntimeOptions | undefined,
  arg: unknown
) {
  return dateFmt(asLiteral(arg), locales, getParam(options) as DateTimeSize);
}

export function duration(
  _locales: string[],
  _options: RuntimeOptions | undefined,
  arg: unknown
) {
  return durationFmt(asLiteral(arg));
}

export function number(
  locales: string[],
  options: RuntimeOptions | undefined,
  arg: unknown
) {
  let n = Number(arg);
  const offset = Number(options && options.pluralOffset);
  if (Number.isFinite(offset)) n -= offset;
  return numberFmt(n, locales, getParam(options) || '', 'USD');
}

export function plural(
  locales: string[],
  options: RuntimeOptions | undefined,
  arg: unknown
) {
  const n = Number(arg);
  if (!Number.isFinite(n)) return n;
  const offset = Number(options && options.pluralOffset);
  const pr = new Intl.PluralRules(locales, options);
  const cat = pr.select(Number.isFinite(offset) ? n - offset : n);
  return [n, cat];
}

export function time(
  locales: string[],
  options: RuntimeOptions | undefined,
  arg: unknown
) {
  return timeFmt(asLiteral(arg), locales, getParam(options) as DateTimeSize);
}
