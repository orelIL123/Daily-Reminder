'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { track } from './analytics/track';

export type CartLine = { key: string; productId: string; size: string; color: string; qty: number };

type CartState = {
  lines: CartLine[];
  count: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (line: Omit<CartLine, 'key'>) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  setSize: (key: string, size: string) => void;
  clear: () => void;
};

const CART_KEY = 'dr-cart-v2';
const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch { /* ignore broken storage */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(lines)); } catch { /* storage full */ }
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, 'key'>) => {
    const key = `${line.productId}__${line.size}__${line.color}`;
    track('add_to_cart', { productId: line.productId });
    setLines(all => {
      const existing = all.find(l => l.key === key);
      if (existing) return all.map(l => (l.key === key ? { ...l, qty: Math.min(20, l.qty + line.qty) } : l));
      return [...all, { ...line, key }];
    });
  }, []);
  const setQty = useCallback((key: string, qty: number) => {
    setLines(all => (qty <= 0 ? all.filter(l => l.key !== key) : all.map(l => (l.key === key ? { ...l, qty: Math.min(20, qty) } : l))));
  }, []);
  const setSize = useCallback((key: string, size: string) => {
    setLines(all => {
      const line = all.find(l => l.key === key);
      if (!line || line.size === size) return all;
      const nextKey = `${line.productId}__${size}__${line.color}`;
      const twin = all.find(l => l.key === nextKey);
      if (twin) return all.filter(l => l.key !== key).map(l => (l.key === nextKey ? { ...l, qty: Math.min(20, l.qty + line.qty) } : l));
      return all.map(l => (l.key === key ? { ...l, size, key: nextKey } : l));
    });
  }, []);
  const remove = useCallback((key: string) => setLines(all => all.filter(l => l.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartState>(() => ({
    lines,
    count: lines.reduce((n, l) => n + l.qty, 0),
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    add, setQty, remove, setSize, clear,
  }), [lines, isOpen, add, setQty, remove, setSize, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
