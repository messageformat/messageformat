import type { PatternElement } from '../data-model';
import { MessageLiteral } from '../message-value';
import type { PatternElementResolver } from './index';

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

export const resolver: PatternElementResolver = {
  type: 'literal',

  resolve: (_ctx, lit: Literal) => new MessageLiteral(lit.value)
};
