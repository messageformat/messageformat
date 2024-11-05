export const LRI = '\u2066';
export const RLI = '\u2067';
export const FSI = '\u2068';
export const PDI = '\u2069';

// Data source: RECOMMENDED and LIMITED_USE scripts from
// https://github.com/unicode-org/cldr/blob/1a914d1/common/properties/scriptMetadata.txt
const RTL = 'Adlm,Arab,Hebr,Mand,Nkoo,Rohg,Syrc,Thaa';

export function getLocaleDir(
  locale: Intl.Locale | string | undefined
): 'ltr' | 'rtl' | 'auto' {
  if (locale) {
    try {
      if (typeof locale === 'string') locale = new Intl.Locale(locale);
      // @ts-expect-error -- New feature, API changed during Stage 3
      const info = locale.getTextInfo?.() ?? locale.textInfo;
      if (info?.direction) return info.direction;
      const script = locale.maximize().script;
      if (script) return RTL.includes(script) ? 'rtl' : 'ltr';
    } catch {
      // Use 'auto' on error
    }
  }
  return 'auto';
}
