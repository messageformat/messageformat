import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { FormattedLiteral } from '../formatted-part';
import type { RuntimeType } from '../runtime';
import type { PatternFormatter } from './index';

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

export function formatLiteralAsPart(
  ctx: Context,
  part: Literal
): FormattedLiteral {
  return new FormattedLiteral(ctx.locales, part.value, part.meta);
}

export function formatLiteralAsValue(
  _ctx: Context,
  part: Literal,
  expected: 'boolean'
): boolean;
export function formatLiteralAsValue(
  _ctx: Context,
  part: Literal,
  expected: 'number'
): number;
export function formatLiteralAsValue(
  _ctx: Context,
  part: Literal,
  expected: RuntimeType | undefined
): string | number | boolean;
export function formatLiteralAsValue(_ctx: Context, part: Literal): string;
export function formatLiteralAsValue(
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

export const formatter: PatternFormatter = {
  formatAsPart: formatLiteralAsPart,
  formatAsString: formatLiteralAsValue,
  formatAsValue: formatLiteralAsValue
};
