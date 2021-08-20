/* eslint-disable @typescript-eslint/no-explicit-any */

export { runtime as defaultRuntime } from './default';
export { runtime as fluentRuntime } from './fluent';
export { runtime as mf1Runtime } from './mf1';

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
    locales: string[],
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

export type RuntimeOptions = Record<string, unknown>;
