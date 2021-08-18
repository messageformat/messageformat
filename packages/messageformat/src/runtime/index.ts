/* eslint-disable @typescript-eslint/no-explicit-any */

import { FormattedPart } from '../format-message';

export { runtime as defaultRuntime } from './default';
export { runtime as fluentRuntime } from './fluent';
export { runtime as mf1Runtime } from './mf1';

/**
 * The runtime function registry available for function references.
 *
 * Functions in `select` are available for case selection, while functions in
 * `format` are available for formatting. Keys do not need to be unique across
 * both realms, and the same function may be available in both.
 *
 * Note that `select` functions are only used for functions immediately within
 * `Select['select']`; for example their arguments are resolved using `format`
 * functions.
 */

export interface Runtime<R = string> {
  select: { [key: string]: RuntimeFunction<string[]> };
  format: { [key: string]: RuntimeFunction<R | FormattedPart<R>> };
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
/**
 * A representation of the parameters/arguments passed to a message formatter.
 * Used by the Variable resolver, and may be extended in a Term.
 */

export interface Scope<S = unknown> {
  [key: string]: S;
}
