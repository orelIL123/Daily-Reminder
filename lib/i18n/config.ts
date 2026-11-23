/*
 * The storefront is English only. (The admin, terms and legal pages are in Hebrew and live outside [lang].)
 * The [lang] route segment is kept so a language can be added later without moving files.
 */
export const locales = ['en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const isLocale = (v: string | undefined): v is Locale => !!v && (locales as readonly string[]).includes(v);
export const dirOf = (_l: Locale) => 'ltr' as const;

/** Path for a locale. English has no prefix. */
export function localePath(_l: Locale, path = '/') {
  return path.startsWith('/') ? path : `/${path}`;
}
