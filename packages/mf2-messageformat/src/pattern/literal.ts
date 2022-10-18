import { MessageLiteral } from '../message-value';

/**
 * An immediately defined value.
 *
 * @remarks
 * Always contains a string value. In Function arguments and options,
 * the expeted type of the value may result in the value being
 * further parsed as a boolean or a number.
 *
 * @beta
 */
export interface Literal {
  type: 'literal' | 'nmtoken';
  value: string;
}

/**
 * Top-level literal content.
 *
 * @beta
 */
export interface Text {
  type: 'text';
  value: string;
}

/**
 * Type guard for {@link Literal} pattern elements
 *
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isLiteral = (part: any): part is Literal =>
  !!part &&
  typeof part === 'object' &&
  (part.type === 'literal' || part.type === 'nmtoken');

/**
 * Type guard for {@link Text} pattern elements
 *
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isText = (part: any): part is Text =>
  !!part && typeof part === 'object' && part.type === 'text';

export function resolveLiteral(lit: Literal | Text) {
  return new MessageLiteral(lit.value);
}
