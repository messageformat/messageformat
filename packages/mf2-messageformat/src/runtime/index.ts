/* eslint-disable @typescript-eslint/no-explicit-any */

import { datetime, number } from './default';

export const defaultRuntime = { datetime, number };

/**
 * The runtime function registry available for function references.
 *
 * Functions used for case selection are expected to return a `string[]`.
 */

export interface Runtime {
  [key: string]: RuntimeFunction<unknown>;
}

export interface RuntimeFunction<T> {
  call(
    locales: readonly string[],
    options: RuntimeOptions | undefined,
    ...args: any[]
  ): T;
  options: RuntimeType | Record<string, RuntimeType>;
}

export type RuntimeType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'any'
  | 'never'
  | string[];

export interface RuntimeOptions {
  localeMatcher: 'best fit' | 'lookup';
  [key: string]: unknown;
}
