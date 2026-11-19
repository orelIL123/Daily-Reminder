'use client';
import { CartProvider } from '@/lib/cart';
import { CatalogContext } from '@/lib/useProducts';
import type { Product } from '@/lib/products';
import CartDrawer from './CartDrawer';

export default function Providers({ products, children }: { products: Product[]; children: React.ReactNode }) {
  return (
    <CatalogContext.Provider value={products}>
      <CartProvider>{children}<CartDrawer /></CartProvider>
    </CatalogContext.Provider>
  );
}
