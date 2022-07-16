/**
 * The minimum amount of information required to determine the locale to use
 * when formatting a MessageValue.
 *
 * @beta
 */
export interface LocaleContext {
  localeMatcher: 'best fit' | 'lookup' | undefined;
  locales: string[];
}

/**
 * When constructing a {@link LocaleContext},
 * {@link MessageValue} or one of its child classes,
 * the locale information may be given in a number of different shapes.
 *
 * @beta
 */
export type LocaleContextArg =
  | string
  | readonly string[]
  | Readonly<LocaleContext>
  | null;

/**
 * Type guard for {@link LocaleContext}
 *
 * @beta
 */
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
 * @beta
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
