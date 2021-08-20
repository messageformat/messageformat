import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { FormattedLiteral } from '../formatted-part';
import type { RuntimeType } from '../runtime';

/**
 * An immediately defined value.
 *
 * Always contains a string value. In Function arguments and options as well as
 * Term scopes, the expeted type of the value may result in the value being
 * further parsed as a boolean or a number.
 */
export interface Literal extends PatternElement {
  type: 'literal';
  value: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isLiteral = (part: any): part is Literal =>
  !!part && typeof part === 'object' && part.type === 'literal';

export function resolveLiteralPart(
  ctx: Context,
  part: Literal
): FormattedLiteral {
  return new FormattedLiteral(ctx.locales, part.value, part.meta);
}

export function resolveLiteralValue(
  _ctx: Context,
  part: Literal,
  expected: 'boolean'
): boolean;
export function resolveLiteralValue(
  _ctx: Context,
  part: Literal,
  expected: 'number'
): number;
export function resolveLiteralValue(
  _ctx: Context,
  part: Literal,
  expected: RuntimeType | undefined
): string | number | boolean;
export function resolveLiteralValue(_ctx: Context, part: Literal): string;
export function resolveLiteralValue(
  _ctx: Context,
  { value }: Literal,
  expected?: RuntimeType
): string | number | boolean {
  switch (expected) {
    case 'boolean':
      return value === 'true' ? true : value === 'false' ? false : value;
    case 'number':
      return Number(value);
    default:
      return value;
  }
}
