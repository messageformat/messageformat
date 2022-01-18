import type { PatternElement } from '../data-model';
import { Formattable } from '../formattable';
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
  asFormattable: (ctx, lit: Literal) =>
    new Formattable<string>(ctx, lit.value, {
      meta: lit.meta,
      type: 'literal'
    })
};
