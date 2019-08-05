const rtlLanguages = [
  'ar',
  'ckb',
  'fa',
  'he',
  'ks($|[^bfh])',
  'lrc',
  'mzn',
  'pa-Arab',
  'ps',
  'ug',
  'ur',
  'uz-Arab',
  'yi'
];
const rtlRegExp = new RegExp('^' + rtlLanguages.join('|^'));

/**
 * Utility formatter function for enforcing Bidi Structured Text by using UCC
 *
 * List inlined from data extracted from CLDR v27 & v28
 * To verify/recreate, use the following:
 *
 *    git clone https://github.com/unicode-cldr/cldr-misc-full.git
 *    cd cldr-misc-full/main/
 *    grep characterOrder -r . | tr '"/' '\t' | cut -f2,6 | grep -C4 right-to-left
 *
 * @private
 */
export function biDiMarkText(text, locale) {
  const isLocaleRTL = rtlRegExp.test(locale);
  const mark = JSON.stringify(isLocaleRTL ? '\u200F' : '\u200E');
  return `${mark} + ${text} + ${mark}`;
}
