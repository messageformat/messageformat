import type { PatternElement } from '../data-model';
import { asFormattable } from '../formattable';
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

export const formatter: PatternFormatter = {
  type: 'literal',
  asFormattable: (_ctx, lit: Literal) => asFormattable(lit.value),
  formatToParts(_ctx, lit: Literal) {
    const fmt: MessageFormatPart = { type: 'literal', value: lit.value };
    if (lit.meta) fmt.meta = { ...lit.meta };
    return [fmt];
  },
  formatToString: (_ctx, lit: Literal) => lit.value
};
