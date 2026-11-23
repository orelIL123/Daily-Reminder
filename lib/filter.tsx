'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

/*
 * The collection's category filter, shared by the header menu, the category strip and the grid.
 * Kept in the URL as ?category=<slug> so a filtered view can be linked and shared.
 */
type Filter = { category: string | null; showCategory: (slug: string | null) => void };
const Ctx = createContext<Filter>({ category: null, showCategory: () => {} });

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setCategory(new URLSearchParams(window.location.search).get('category'));
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);

  const showCategory = useCallback((slug: string | null) => {
    setCategory(slug);
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set('category', slug); else url.searchParams.delete('category');
    url.hash = 'collection';
    if (url.pathname !== '/') { window.location.href = url.toString(); return; }
    history.pushState(null, '', url);
    document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return <Ctx.Provider value={{ category, showCategory }}>{children}</Ctx.Provider>;
}

export const useFilter = () => useContext(Ctx);
