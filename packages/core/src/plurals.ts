import * as Cardinals from 'make-plural/cardinals';
import * as PluralCategories from 'make-plural/pluralCategories';
import * as Plurals from 'make-plural/plurals';
import { identifier } from 'safe-identifier';

function normalize(locale: string) {
  if (typeof locale !== 'string' || locale.length < 2)
    throw new RangeError(`Invalid language tag: ${locale}`);

  // The only locale for which anything but the primary subtag matters is
  // Portuguese as spoken in Portugal.
  if (locale.startsWith('pt-PT')) return 'pt-PT';

  const m = locale.match(/.+?(?=[-_])/);
  return m ? m[0] : locale;
}

export interface PluralFunction {
  (value: number | string, ord?: boolean): Plurals.PluralCategory;
  cardinals?: Plurals.PluralCategory[];
  ordinals?: Plurals.PluralCategory[];
  module?: string;
}

export interface PluralObject {
  isDefault: boolean;
  id: string;
  lc: string;
  locale: string;
  getCardinal?: (value: string | number) => Plurals.PluralCategory;
  getPlural: PluralFunction;
  cardinals: Plurals.PluralCategory[];
  ordinals: Plurals.PluralCategory[];
}

export function getPlural(
  locale: string | PluralFunction
): PluralObject | null {
  if (typeof locale === 'function') {
    const lc = normalize(locale.name);
    return {
      isDefault: false,
      id: identifier(lc),
      lc,
      locale: locale.name,
      getPlural: locale,
      cardinals: locale.cardinals || [],
      ordinals: locale.ordinals || []
    };
  }
  const lc = normalize(locale);
  const id = identifier(lc);
  if (isPluralId(id)) {
    return {
      isDefault: true,
      id,
      lc,
      locale,
      getCardinal: Cardinals[id],
      getPlural: Plurals[id],
      cardinals: PluralCategories[id].cardinal,
      ordinals: PluralCategories[id].ordinal
    };
  }
  return null;
}

export function getAllPlurals(firstLocale: string) {
  const keys = Object.keys(Plurals).filter(key => key !== firstLocale);
  keys.unshift(firstLocale);
  return keys.map(getPlural) as PluralObject[];
}

export function hasPlural(locale: string) {
  const lc = normalize(locale);
  return identifier(lc) in Plurals;
}

function isPluralId(id: string): id is keyof typeof Plurals {
  return id in Plurals;
}
