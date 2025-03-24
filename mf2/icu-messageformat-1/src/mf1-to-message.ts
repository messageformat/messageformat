import { Token, parse } from '@messageformat/parser';
import {
  type Model as MF,
  MessageFormat,
  MessageFormatOptions
} from 'messageformat';
import { MF1Functions } from './functions.ts';
import { mf1ToMessageData } from './mf1-to-message-data.ts';

export type MF1Options = {
  /** See {@link https://messageformat.github.io/messageformat/api/parser.parseoptions/ ParseOptions.strict} in @messageformat/parser */
  strict?: boolean;
};

/**
 * Compile an ICU MessageFormat 1 message into a {@link MessageFormat} instance.
 *
 * ```js
 * import { mf1ToMessage } from '@messageformat/icu-messageformat-1';
 *
 * const msg = mf1ToMessage('en', 'The total is {V, number, ::currency/EUR}.');
 * msg.format({ V: 4.2 });
 * ```
 *
 * ```js
 * 'The total is €4.20.'
 * ```
 *
 * @param locales - The locale to use for the message.
 * @param source - An ICU MessageFormat message, either in its syntax representation,
 *   as an array of `@messageformat/parser` {@link https://messageformat.github.io/messageformat/api/parser.parse/ | AST tokens},
 *   or as a {@link MF.Message | Model.Message} data structure.
 * @param options - See {@link MF1Options} and {@link MessageFormatOptions}
 */
export function mf1ToMessage(
  locales: string | string[] | undefined,
  source: string | Token[] | MF.Message,
  { strict, ...opt }: MF1Options & MessageFormatOptions = {}
): MessageFormat {
  let msg: MF.Message;
  if (typeof source === 'string') {
    const ast = parse(source, { strict });
    msg = mf1ToMessageData(ast);
  } else if (Array.isArray(source)) {
    msg = mf1ToMessageData(source);
  } else {
    msg = source;
  }
  opt.functions = opt.functions
    ? Object.assign(Object.create(null), MF1Functions, opt.functions)
    : MF1Functions;
  return new MessageFormat(locales, msg, opt);
}
