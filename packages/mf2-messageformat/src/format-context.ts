import type { Expression, Literal, VariableRef } from './pattern';
import type { MessageFunctions, MessageValue } from './runtime';

export interface Context {
  functions: MessageFunctions;
  onError(error: unknown): void;
  resolveExpression(expr: Expression): MessageValue;
  resolveValue(value: Literal | VariableRef): unknown;
  localeMatcher: 'best fit' | 'lookup';
  locales: string[];
  /** Cache for local variables */
  localVars: WeakSet<MessageValue>;
  /**
   * A representation of the parameters/arguments passed to a message formatter,
   * and extended by declarations.
   * Used by the Variable resolver.
   */
  scope: Record<string, unknown>;
}
