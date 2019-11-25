import { compactFormat } from 'cldr-compact-number';

export default class CompactFormat {
  constructor(locales, localeData, options) {
    this._locales = locales;
    this._options = options;
    this._localeData = localeData;
  }

  format(value, locale) {
    compactFormat(value, this._locales, this._localeData, this._options);
  }
}
