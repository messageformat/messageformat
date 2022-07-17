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
export type Text = {
  type: 'text';
  value: string;
};

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

export function resolveLiteral(lit: Literal | Text) {
  return new MessageLiteral(lit.value);
}
