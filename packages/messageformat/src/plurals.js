import * as pluralCategories from 'make-plural/pluralCategories';
import * as plurals from 'make-plural/plurals';
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
      default: false,
      id: identifier(lc),
      lc,
      locale: locale.name,
      getCategory: locale,
      cardinals: locale.cardinals || [],
      ordinals: locale.ordinals || [],
      getSource: locale.getSource || (() => ({ source: String(locale) }))
    };
  }
  const lc = normalize(locale);
  const getCategory = plurals[lc];
  if (!getCategory) return null;
  const { cardinal, ordinal } = pluralCategories[lc] || {};
  return {
    default: true,
    id: identifier(lc),
    lc,
    locale,
    getCategory,
    cardinals: cardinal || [],
    ordinals: ordinal || [],
    getSource: () => ({ module: 'make-plural/plurals' })
  };
}

export function getAllPlurals(firstLocale) {
  const keys = Object.keys(plurals).filter(key => key !== firstLocale);
  keys.unshift(firstLocale);
  return keys.map(getPlural);
}

export function hasPlural(locale) {
  const lc = normalize(locale);
  return lc in plurals;
}
