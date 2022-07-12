import { parse } from '@messageformat/parser';
import * as PluralCategories from 'make-plural/pluralCategories';
import { Message, MessageFormat, MessageFormatOptions } from 'messageformat';
import { astToMessage } from './mf1-ast-to-message';
import { getMF1Runtime } from './mf1-runtime';

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

export type MF1Options = {
  strict?: boolean;
};

export function compileMF1Message(
  source: string | Message,
  locale: string,
  { strict, ...opt }: MF1Options & MessageFormatOptions = {}
) {
  const msg =
    typeof source === 'string'
      ? compileMF1MessageData(source, locale, { strict })
      : source;
  opt.runtime = Object.assign(getMF1Runtime(), opt.runtime);
  return new MessageFormat(msg, [locale], opt);
}

export function compileMF1MessageData(
  src: string,
  locale: string,
  { strict }: MF1Options = {}
) {
  const lc = normalize(locale);
  if (!isPluralId(lc)) throw new Error(`Unsupported locale: ${locale}`);
  const { cardinal, ordinal } = PluralCategories[lc];
  const ast = parse(src, { cardinal, ordinal, strict });
  return astToMessage(ast);
}
