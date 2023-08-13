import type { MessageValue } from './message-value';
import {
  Expression,
  FunctionRef,
  Literal,
  Reserved,
  Text,
  VariableRef
} from './pattern';
import { Runtime } from './runtime';

export interface Context {
  onError(error: unknown, value: MessageValue): void;
  resolve(
    elem: Expression | FunctionRef | Literal | Reserved | Text | VariableRef
  ): MessageValue;
  localeMatcher: 'best fit' | 'lookup';
  locales: string[];
  runtime: Runtime;
  /**
   * A representation of the parameters/arguments passed to a message formatter,
   * and extended by declarations.
   * Used by the Variable resolver.
   */
  scope: Record<string, unknown>;
}
