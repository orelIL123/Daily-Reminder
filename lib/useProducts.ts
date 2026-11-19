'use client';
import { useEffect, useState } from 'react';
import { initialProducts, loadProducts, Product } from './products';

/** Products for the storefront. Today: demo data + browser-local admin edits.
 *  Later: swap the body for a fetch from Shopify / Supabase. */
export function useProducts(): Product[] {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  useEffect(() => {
    const refresh = () => setProducts(loadProducts());
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('rail-products-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('rail-products-updated', refresh);
    };
  }, []);
  return products;
}
