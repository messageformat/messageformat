import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import type { MessageFormatPart } from '../formatted-part';
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

export function formatLiteralAsParts(_ctx: Context, part: Literal) {
  const fmt: MessageFormatPart = { type: 'literal', value: part.value };
  if (part.meta) fmt.meta = { ...part.meta };
  return [fmt];
}

export const formatLiteralAsValue = (_ctx: unknown, { value }: Literal) =>
  value;

export const formatter: PatternFormatter = {
  type: 'literal',
  formatAsParts: formatLiteralAsParts,
  formatAsString: formatLiteralAsValue,
  formatAsValue: formatLiteralAsValue
};
