import { parse } from '@messageformat/parser';
import * as PluralCategories from 'make-plural/pluralCategories';
import { Message, MessageFormat, MessageFormatOptions } from 'messageformat';
import { astToMessage } from './ast-to-message';
import { getMF1Runtime } from './runtime';

const isPluralId = (id: string): id is keyof typeof PluralCategories =>
  id in PluralCategories;

function normalize(locale: string) {
  if (typeof locale !== 'string' || locale.length < 2)
    throw new Error(`Invalid language tag: ${locale}`);

  // The only locale for which anything but the primary subtag matters is
  // Portuguese as spoken in Portugal.
  if (locale.startsWith('pt-PT')) return 'pt_PT';

  const m = locale.match(/.+?(?=[-_])/);
  return m ? m[0] : locale;
}

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
 * @param locale - The locale code to use for the message.
 * @param options - See {@link MF1Options} and {@link messageformat#MessageFormatOptions}
 */
export function compileMF1Message(
  source: string | Message,
  locale: string,
  { strict, ...opt }: MF1Options & MessageFormatOptions = {}
): MessageFormat {
  const msg =
    typeof source === 'string'
      ? compileMF1MessageData(source, locale, { strict })
      : source;
  opt.runtime = Object.assign(getMF1Runtime(), opt.runtime);
  return new MessageFormat(msg, [locale], opt);
}

/**
 * Compile an ICU MessageFormat 1 message into a {@link messageformat#Message} data object.
 *
 * @beta
 * @param src - A Fluent resource, as the string contents of an FTL file.
 * @param locale - The locale code to use for the message.
 * @param options - See {@link MF1Options}
 */
export function compileMF1MessageData(
  src: string,
  locale: string,
  { strict }: MF1Options = {}
): Message {
  const lc = normalize(locale);
  if (!isPluralId(lc)) throw new Error(`Unsupported locale: ${locale}`);
  const { cardinal, ordinal } = PluralCategories[lc];
  const ast = parse(src, { cardinal, ordinal, strict });
  return astToMessage(ast);
}
