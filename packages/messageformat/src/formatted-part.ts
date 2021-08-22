import type { Meta } from './data-model';
import { Context } from './format-context';
import { Formattable } from './formattable';
import { isLiteral, isVariable, Literal, Variable } from './pattern';

export type MessageFormatPart = { meta?: Meta; source?: string } & (
  | Intl.DateTimeFormatPart
  | Intl.NumberFormatPart
  | { type: 'literal'; value: string }
  | { type: 'dynamic'; value: unknown; source: string }
  | { type: 'fallback'; value: string; source: string }
  | { type: 'message'; value: ''; meta: Meta }
);

export function formatValueToParts(
  { localeMatcher, locales }: Context,
  value: unknown,
  source: string
): MessageFormatPart[] {
  const fmt = Formattable.from(value);
  return fmt.toParts(locales, { localeMatcher }, source);
}

export function argumentSource(arg: Literal | Variable): string {
  if (isVariable(arg)) {
    return (
      '$' +
      arg.var_path
        .map(vp => {
          const str = argumentSource(vp);
          return str[0] === '$' ? `(${str})` : str;
        })
        .join('.')
    );
  }
  return isLiteral(arg) ? String(arg.value) : '???';
}
