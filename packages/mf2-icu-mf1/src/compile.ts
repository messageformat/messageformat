import { parse } from '@messageformat/parser';
import { Message, MessageFormat, MessageFormatOptions } from 'messageformat';
import { astToMessage } from './ast-to-message';
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
 * @param source - An ICU MessageFormat message, either as its string contents,
 *   or as a {@link messageformat#Message} data structure.
 * @param locales - The locale to use for the message.
 * @param options - See {@link MF1Options} and {@link messageformat#MessageFormatOptions}
 */
export function mf1ToMessage(
  source: string | Message,
  locales?: string | string[],
  { strict, ...opt }: MF1Options & MessageFormatOptions = {}
): MessageFormat {
  const msg =
    typeof source === 'string' ? mf1ToMessageData(source, { strict }) : source;
  opt.runtime = Object.assign(getMF1Runtime(), opt.runtime);
  return new MessageFormat(msg, locales, opt);
}

/**
 * Compile an ICU MessageFormat 1 message into a {@link messageformat#Message} data object.
 *
 * @beta
 * @param src - A Fluent resource, as the string contents of an FTL file.
 * @param options - See {@link MF1Options}
 */
export function mf1ToMessageData(
  src: string,
  { strict }: MF1Options = {}
): Message {
  const ast = parse(src, { strict });
  return astToMessage(ast);
}
