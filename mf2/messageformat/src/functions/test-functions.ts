/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * These functions are used only in the MF2 test suite,
 * and are not a part of the library's public API.
 */

import { MessageResolutionError } from '../errors.ts';
import type { MessageValue } from '../message-value.ts';
import type { MessageFunctionContext } from '../resolve/function-context.ts';
import { asPositiveInteger, asString } from './utils.ts';

interface TestValue extends MessageValue {
  readonly type: 'test';
  readonly options: {
    canFormat: boolean;
    canSelect: boolean;
    decimalPlaces: 0 | 1;
    failsFormat: boolean;
    failsSelect: boolean;
  };
}

export const TestFunctions: Record<string, typeof testFunction> = {
  'test:format': (ctx, options, input) =>
    testFunction(ctx, { ...options, canFormat: true, canSelect: false }, input),
  'test:function': (ctx, options, input) =>
    testFunction(ctx, { ...options, canFormat: true, canSelect: true }, input),
  'test:select': (ctx, options, input) =>
    testFunction(ctx, { ...options, canFormat: false, canSelect: true }, input)
};

function testFunction(
  { onError, source }: MessageFunctionContext,
  options: Record<string, unknown>,
  input: unknown
): TestValue {
  const opt: TestValue['options'] = {
    canFormat: Boolean(options.canFormat),
    canSelect: Boolean(options.canSelect),
    decimalPlaces: 0,
    failsFormat: false,
    failsSelect: false
  };
  if (typeof input === 'object') {
    const valueOf = input?.valueOf;
    if (typeof valueOf === 'function') {
      if ((input as any).type === 'test') {
        Object.assign(opt, (input as any).options);
      }
      input = valueOf.call(input);
    }
  }
  if (typeof input === 'string') {
    try {
      input = JSON.parse(input);
    } catch {
      // handled below
    }
  }
  if (typeof input !== 'number') {
    const msg = 'Input is not numeric';
    throw new MessageResolutionError('bad-operand', msg, source);
  }
  const value: number = input; // Otherwise TS complains in callbacks

  if ('decimalPlaces' in options) {
    try {
      const dp = asPositiveInteger(options.decimalPlaces);
      if (dp === 0 || dp === 1) opt.decimalPlaces = dp;
      else throw 1;
    } catch {
      const msg = `Invalid option decimalPlaces=${options.decimalPlaces}`;
      throw new MessageResolutionError('bad-option', msg, source);
    }
  }
  if ('fails' in options) {
    try {
      switch (asString(options.fails)) {
        case 'never':
          break;
        case 'select':
          opt.failsSelect = true;
          break;
        case 'format':
          opt.failsFormat = true;
          break;
        case 'always':
          opt.failsSelect = true;
          opt.failsFormat = true;
          break;
        default:
          throw 1;
      }
    } catch {
      const msg = `Invalid option fails=${options.fails}`;
      onError(new MessageResolutionError('bad-option', msg, source));
    }
  }

  return {
    type: 'test',
    source,
    get options() {
      return { ...opt };
    },
    selectKey: opt.canSelect
      ? keys => {
          if (opt.failsSelect) throw new Error('Selection failed');
          if (value === 1) {
            if (opt.decimalPlaces === 1 && keys.has('1.0')) return '1.0';
            if (keys.has('1')) return '1';
          }
          return null;
        }
      : undefined,
    toParts: opt.canFormat
      ? () => {
          if (opt.failsFormat) throw new Error('Formatting failed');
          const parts = Array.from(testParts(value, opt.decimalPlaces));
          return [{ type: 'test', source, locale: 'und', parts }];
        }
      : undefined,
    toString: opt.canFormat
      ? () => {
          if (opt.failsFormat) throw new Error('Formatting failed');
          const parts = Array.from(testParts(value, opt.decimalPlaces));
          return parts.map(part => part.value).join('');
        }
      : undefined,
    valueOf: () => value
  };
}

function* testParts(num: number, decimalPlaces: 0 | 1) {
  if (num < 0) yield { type: 'neg', value: '-' };
  const abs = Math.abs(num);
  yield { type: 'int', value: String(Math.floor(abs)) };
  if (decimalPlaces) {
    yield { type: 'dot', value: '.' };
    const frac = Math.floor((abs - Math.floor(abs)) * 10);
    yield { type: 'frac', value: String(frac) };
  }
}
