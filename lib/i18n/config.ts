export const locales = ['he', 'en'] as const;
export type Locale = (typeof locales)[number];

/** Hebrew is the main language: it lives at "/", English at "/en". */
export const defaultLocale: Locale = 'he';

export const isLocale = (v: string | undefined): v is Locale => !!v && (locales as readonly string[]).includes(v);
export const dirOf = (l: Locale) => (l === 'he' ? 'rtl' : 'ltr');

/** Path for a locale: Hebrew has no prefix, English is under /en. */
export function localePath(l: Locale, path = '/') {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (l === defaultLocale) return clean;
  return clean === '/' ? `/${l}` : `/${l}${clean}`;
}

/** Strip the locale prefix from a pathname. */
export function stripLocale(pathname: string) {
  const m = pathname.match(/^\/(en|he)(\/.*)?$/);
  return m ? (m[2] || '/') : pathname;
}
