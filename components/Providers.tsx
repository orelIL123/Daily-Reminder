'use client';
import { CartProvider } from '@/lib/cart';
import { CatalogContext } from '@/lib/useProducts';
import { I18nProvider } from '@/lib/i18n/client';
import type { Locale } from '@/lib/i18n/config';
import type { Product } from '@/lib/products';
import CartDrawer from './CartDrawer';

export default function Providers({ products, lang, children }: { products: Product[]; lang: Locale; children: React.ReactNode }) {
  return (
    <I18nProvider lang={lang}>
      <CatalogContext.Provider value={products}>
        <CartProvider>{children}<CartDrawer /></CartProvider>
      </CatalogContext.Provider>
    </I18nProvider>
  );
}
