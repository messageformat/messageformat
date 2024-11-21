import type { Context } from '../format-context';
import { lookupVariableRef } from './resolve-variable.js';
import type { Literal, VariableRef } from '../data-model/types.js';

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
export function getValueSource(value: Literal | VariableRef): string;
export function getValueSource(
  value: Literal | VariableRef | undefined
): string | undefined;
export function getValueSource(value: Literal | VariableRef | undefined) {
  switch (value?.type) {
    case 'literal':
      return (
        '|' + value.value.replaceAll('\\', '\\\\').replaceAll('|', '\\|') + '|'
      );
    case 'variable':
      return '$' + value.name;
    default:
      return undefined;
  }
}
