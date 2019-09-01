import * as PluralCategories from 'make-plural/pluralCategories';
import * as Plurals from 'make-plural/plurals';
import { identifier } from 'safe-identifier';

const PLURAL_MODULE = 'make-plural/plurals';

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
      ordinals: locale.ordinals || []
    };
  }
  const lc = normalize(locale);
  const pluralFn = Plurals[lc];
  if (!pluralFn) return null;
  const getCategory = (n, ord) => pluralFn(n, ord);
  getCategory.module = PLURAL_MODULE;
  getCategory.toString = () => String(pluralFn);
  const categories = PluralCategories[lc] || {};
  return {
    default: true,
    id: identifier(lc),
    lc,
    locale,
    getCategory,
    cardinals: categories.cardinal || [],
    ordinals: categories.ordinal || []
  };
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
