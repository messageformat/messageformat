import * as Cardinals from 'make-plural/cardinals';
import * as PluralCategories from 'make-plural/pluralCategories';
import * as Plurals from 'make-plural/plurals';
import { identifier } from 'safe-identifier';

function normalize(locale) {
  if (typeof locale !== 'string' || locale.length < 2)
    throw new RangeError(`Invalid language tag: ${locale}`);

  // The only locale for which anything but the primary subtag matters is
  // Portuguese as spoken in Portugal.
  if (locale.startsWith('pt-PT')) return 'pt-PT';

  const m = locale.match(/.+?(?=[-_])/);
  return m ? m[0] : locale;
}

export function getPlural(locale) {
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
  if (lc in Plurals) {
    return {
      isDefault: true,
      id: identifier(lc),
      lc,
      locale,
      getCardinal: Cardinals[lc],
      getPlural: Plurals[lc],
      cardinals: PluralCategories[lc].cardinal,
      ordinals: PluralCategories[lc].ordinal
    };
  }
  return null;
}

export function getAllPlurals(firstLocale) {
  const keys = Object.keys(Plurals).filter(key => key !== firstLocale);
  keys.unshift(firstLocale);
  return keys.map(getPlural);
}

export function hasPlural(locale) {
  const lc = normalize(locale);
  return lc in Plurals;
}
