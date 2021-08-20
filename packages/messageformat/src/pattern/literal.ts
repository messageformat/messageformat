import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { FormattedLiteral } from '../formatted-part';
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

export const formatLiteralAsPart = (ctx: Context, part: Literal) =>
  new FormattedLiteral(ctx.locales, part.value, part.meta);

export const formatLiteralAsValue = (_ctx: unknown, { value }: Literal) =>
  value;

export const formatter: PatternFormatter = {
  type: 'literal',
  formatAsPart: formatLiteralAsPart,
  formatAsString: formatLiteralAsValue,
  formatAsValue: formatLiteralAsValue
};
