import { Token, parse } from '@messageformat/parser';
import { Message, MessageFormat, MessageFormatOptions } from 'messageformat';
import { getMF1Functions } from './functions.ts';
import { mf1ToMessageData } from './mf1-to-message-data.ts';

export type MF1Options = {
  /** See {@link https://messageformat.github.io/messageformat/api/parser.parseoptions/ ParseOptions.strict} in @messageformat/parser */
  strict?: boolean;
};

/**
 * Compile an ICU MessageFormat 1 message into a {@link MessageFormat} instance.
 *
 * A runtime provided by {@link getMF1Functions} is automatically used in these instances.
 *
 * @param source - An ICU MessageFormat message, either in its syntax representation,
 *   as an array of `@messageformat/parser` {@link https://messageformat.github.io/messageformat/api/parser.parse/ | AST tokens},
 *   or as a {@link Message} data structure.
 * @param locales - The locale to use for the message.
 * @param options - See {@link MF1Options} and {@link MessageFormatOptions}
 */
export function mf1ToMessage(
  source: string | Token[] | Message,
  locales?: string | string[],
  { strict, ...opt }: MF1Options & MessageFormatOptions = {}
): MessageFormat {
  let msg: Message;
  if (typeof source === 'string') {
    const ast = parse(source, { strict });
    msg = mf1ToMessageData(ast);
  } else if (Array.isArray(source)) {
    msg = mf1ToMessageData(source);
  } else {
    msg = source;
  }
  opt.functions = Object.assign(getMF1Functions(), opt.functions);
  return new MessageFormat(locales, msg, opt);
}
