import { parse, Token } from '@messageformat/parser';
import { Message, MessageFormat, MessageFormatOptions } from 'messageformat';
import { mf1ToMessageData } from './mf1-to-message-data';
import { getMF1Runtime } from './runtime';

/** @beta */
export type MF1Options = {
  /** See {@link @messageformat/parser#ParseOptions.strict} */
  strict?: boolean;
};

/**
 * Compile an ICU MessageFormat 1 message into a {@link messageformat#MessageFormat} instance.
 *
 * A runtime provided by {@link getMF1Runtime} is automatically used in these instances.
 *
 * @beta
 * @param source - An ICU MessageFormat message, either in its syntax representation,
 *   as an array of `@messageformat/parser` {@link @messageformat/parser#parse | AST tokens},
 *   or as a {@link messageformat#Message} data structure.
 * @param locales - The locale to use for the message.
 * @param options - See {@link MF1Options} and {@link messageformat#MessageFormatOptions}
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
  opt.runtime = Object.assign(getMF1Runtime(), opt.runtime);
  return new MessageFormat(msg, locales, opt);
}
