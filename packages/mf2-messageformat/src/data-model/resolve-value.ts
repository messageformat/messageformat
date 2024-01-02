import type { Context } from '../format-context';
import type { Literal, VariableRef } from './types';
import { lookupVariableRef } from './resolve-variable.js';

/** @internal */
export function resolveValue(
  ctx: Context,
  value: Literal | VariableRef
): unknown {
  switch (value.type) {
    case 'literal':
      return value.value;
    case 'variable':
      return lookupVariableRef(ctx, value);
    default:
      // @ts-expect-error - should never happen
      throw new Error(`Unsupported value: ${value.type}`);
  }
}

/** @internal */
export function getValueSource(value: Literal | VariableRef | undefined) {
  switch (value?.type) {
    case 'literal':
      return '|' + value.value + '|';
    case 'variable':
      return '$' + value.name;
    default:
      return undefined;
  }
}
