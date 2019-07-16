const reservedES3 = {
  break: true,
  continue: true,
  delete: true,
  else: true,
  for: true,
  function: true,
  if: true,
  in: true,
  new: true,
  return: true,
  this: true,
  typeof: true,
  var: true,
  void: true,
  while: true,
  with: true,
  case: true,
  catch: true,
  default: true,
  do: true,
  finally: true,
  instanceof: true,
  switch: true,
  throw: true,
  try: true
};

const reservedES5 = {
  // in addition to reservedES3
  debugger: true,
  class: true,
  enum: true,
  extends: true,
  super: true,
  const: true,
  export: true,
  import: true,
  null: true,
  true: true,
  false: true,
  implements: true,
  let: true,
  private: true,
  public: true,
  yield: true,
  interface: true,
  package: true,
  protected: true,
  static: true
};

/**
 * Utility function for quoting an Object's key value if required
 *
 * Quotes the key if it contains invalid characters or is an
 * ECMAScript 3rd Edition reserved word (for IE8).
 *
 * @private
 */
export function propname(key, obj) {
  if (/^[A-Z_$][0-9A-Z_$]*$/i.test(key) && !reservedES3[key]) {
    return obj ? `${obj}.${key}` : key;
  } else {
    const jkey = JSON.stringify(key);
    return obj ? obj + `[${jkey}]` : jkey;
  }
}

/**
 * Utility function for escaping a function name if required
 *
 * @private
 */
export function funcname(key) {
  const fn = key.trim().replace(/\W+/g, '_');
  return reservedES3[fn] || reservedES5[fn] || /^\d/.test(fn) ? '_' + fn : fn;
}

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
