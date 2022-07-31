import { Message, MessageFormat, MessageFormatOptions } from 'messageformat';
import { MF1Options, mf1ToMessageData } from './mf1-to-message-data';
import { getMF1Runtime } from './runtime';

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
