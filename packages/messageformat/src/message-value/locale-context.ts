export interface LocaleContext {
  localeMatcher: 'best fit' | 'lookup' | undefined;
  locales: string[];
}

/**
 * Create a new LocaleContext, using `orig` as a base.
 *
 * @returns `null` if both arguments are `null`
 */
export function extendLocaleContext(
  orig: LocaleContext | null,
  lc: string | string[] | LocaleContext | null
): LocaleContext | null {
  let { locales, localeMatcher } = orig ?? {};

  if (lc && typeof lc === 'string') {
    locales ??= [lc];
  } else if (Array.isArray(lc)) {
    locales ??= lc.slice();
  } else if (lc && typeof lc === 'object' && Array.isArray(lc.locales)) {
    locales ??= lc.locales.slice();
    localeMatcher ??= lc.localeMatcher;
  }

  return locales ? { locales, localeMatcher } : null;
}
