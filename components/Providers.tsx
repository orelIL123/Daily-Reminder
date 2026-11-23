'use client';
import { CartProvider } from '@/lib/cart';
import { CatalogContext, CategoriesContext } from '@/lib/useProducts';
import { I18nProvider } from '@/lib/i18n/client';
import type { Locale } from '@/lib/i18n/config';
import type { Product } from '@/lib/products';
import type { Category } from '@/lib/catalog';
import CartDrawer from './CartDrawer';
import AppPrompt from './AppPrompt';
import { FilterProvider } from '@/lib/filter';

export default function Providers({ products, categories, lang, children }: { products: Product[]; categories: Category[]; lang: Locale; children: React.ReactNode }) {
  return (
    <I18nProvider lang={lang}>
      <CatalogContext.Provider value={products}>
        <CategoriesContext.Provider value={categories}>
          <FilterProvider><CartProvider>{children}<CartDrawer /><AppPrompt /></CartProvider></FilterProvider>
        </CategoriesContext.Provider>
      </CatalogContext.Provider>
    </I18nProvider>
  );
}
