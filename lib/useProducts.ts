'use client';
import { createContext, useContext } from 'react';
import { initialProducts, type Product } from './products';

/** The catalogue loaded on the server (Supabase) and handed to every client component. */
export const CatalogContext = createContext<Product[]>(initialProducts);

export function useProducts(): Product[] {
  return useContext(CatalogContext);
}

/** True when every variant of an active product is at zero — shown greyed with a "sold out" label. */
export function isSoldOut(p: Product): boolean {
  return !!p.variants && p.variants.length > 0 && p.variants.every(v => v.stock <= 0);
}

/** Stock for one size/color; null when the product has no stock data (demo fallback). */
export function stockFor(p: Product, size: string, color: string): number | null {
  if (!p.variants) return null;
  return p.variants.find(v => v.size === size && v.color === color)?.stock ?? 0;
}
