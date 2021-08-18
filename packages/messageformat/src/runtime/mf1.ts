import {
  date as dateFmt,
  duration as durationFmt,
  numberFmt,
  time as timeFmt
} from '@messageformat/runtime/lib/formatters';
import { runtime as MF2 } from './default';
import type { Runtime, RuntimeFunction, RuntimeOptions } from './index';

const asLiteral = (arg: unknown) =>
  typeof arg === 'number' || typeof arg === 'string' ? arg : String(arg);

const getParam = (options: RuntimeOptions | undefined) =>
  (options && String(options.param).trim()) || undefined;

type DateTimeSize = 'short' | 'default' | 'long' | 'full';

export const date: RuntimeFunction<string> = {
  call: function date(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: unknown
  ) {
    return dateFmt(asLiteral(arg), locales, getParam(options) as DateTimeSize);
  },

  options: { param: 'string' }
};

export const duration: RuntimeFunction<string> = {
  call: function duration(_locales: string[], _options: unknown, arg: unknown) {
    return durationFmt(asLiteral(arg));
  },
  options: 'never'
};

export const number: RuntimeFunction<string> = {
  call: function number(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: unknown
  ) {
    let n = Number(arg);
    const offset = Number(options && options.pluralOffset);
    if (Number.isFinite(offset)) n -= offset;
    return numberFmt(n, locales, getParam(options) || '', 'USD');
  },

  options: {
    param: 'string',
    pluralOffset: 'number'
  }
};

export const plural: RuntimeFunction<number | [number, Intl.LDMLPluralRule]> = {
  call: function plural(
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
  },

  options: Object.assign({ pluralOffset: 'number' }, MF2.select.plural.options)
};

export const time: RuntimeFunction<string> = {
  call: function time(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: unknown
  ) {
    return timeFmt(asLiteral(arg), locales, getParam(options) as DateTimeSize);
  },

  options: { param: ['short', 'default', 'long', 'full'] }
};

export const runtime: Runtime<string> = {
  select: { plural },
  format: { date, duration, number, time }
};
