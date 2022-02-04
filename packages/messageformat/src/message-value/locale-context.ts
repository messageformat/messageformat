export interface LocaleContext {
  localeMatcher: 'best fit' | 'lookup' | undefined;
  locales: string[];
}

export type LocaleContextArg =
  | string
  | readonly string[]
  | Readonly<LocaleContext>
  | null;

export const isLocaleContext = (
  lc: LocaleContextArg
): lc is Readonly<LocaleContext> =>
  !!lc &&
  typeof lc === 'object' &&
  Array.isArray((lc as LocaleContext).locales) &&
  typeof (lc as LocaleContext).locales[0] === 'string';

/**
 * Create a new LocaleContext, using `orig` as a base.
 *
 * @returns `null` if both arguments are `null`
 */
export function extendLocaleContext(
  orig: Readonly<LocaleContext> | null,
  lc: LocaleContextArg
): LocaleContext | null {
  let { locales, localeMatcher } = orig ?? {};

  if (lc && typeof lc === 'string') {
    locales ??= [lc];
  } else if (Array.isArray(lc)) {
    locales ??= lc.slice();
  } else if (isLocaleContext(lc)) {
    locales ??= lc.locales.slice();
    localeMatcher ??= lc.localeMatcher;
  }

  return locales ? { locales, localeMatcher } : null;
}
