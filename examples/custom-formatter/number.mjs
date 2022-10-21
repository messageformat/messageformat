export function number(value, locale, options = {}) {
  const nf = new Intl.NumberFormat(locale, options);
  return nf.format(value);
}
