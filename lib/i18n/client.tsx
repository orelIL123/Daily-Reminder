'use client';

import { createContext, useContext, useMemo } from 'react';
import { dictionaries, type Dictionary } from './dictionaries';
import { dirOf, localePath, type Locale } from './config';
import type { Product } from '@/lib/products';
import type { L } from '@/store.config';
import { formatPrice } from '@/lib/money';

type I18n = {
  lang: Locale;
  dir: 'rtl' | 'ltr';
  t: Dictionary;
  /** Store copy from store.config in the current language. */
  tr: (v: L) => string;
  /** Link to a page in the current language. */
  href: (path: string) => string;
  price: (n: number) => string;
  name: (p: Product) => string;
  description: (p: Product) => string;
  category: (p: Product) => string;
  color: (c: string) => string;
};

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  const value = useMemo<I18n>(() => {
    const t = dictionaries[lang];
    return {
      lang,
      dir: dirOf(lang),
      t,
      tr: v => v[lang],
      href: path => localePath(lang, path),
      price: n => formatPrice(n, lang),
      name: p => (lang === 'en' ? p.nameEn || p.name : p.name),
      description: p => (lang === 'en' ? p.descriptionEn || p.description : p.description),
      category: p => (lang === 'en' ? p.category : p.categoryHe || p.category),
      color: c => t.colors[c] ?? c,
    };
  }, [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n must be used inside <I18nProvider>');
  return v;
}
