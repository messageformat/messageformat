import pluralCategories from 'make-plural/umd/pluralCategories';
import plurals from 'make-plural/umd/plurals';
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
      getSource: locale.getSource || (() => String(locale))
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
    getSource: () => ({
      import: identifier(lc),
      package: 'make-plural/es6/plurals',
      source: String(getCategory)
    })
  };
}

export function getAllPlurals(firstLocale) {
  const keys = Object.keys(plurals).filter(key => key !== firstLocale);
  keys.unshift(firstLocale);
  return keys.map(getPlural);
}
