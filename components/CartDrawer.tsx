'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Minus, Plus, X } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useProducts } from '@/lib/useProducts';
import { formatPrice } from '@/lib/money';

export default function CartDrawer() {
  const cart = useCart();
  const products = useProducts();
  const rows = cart.lines
    .map(l => ({ line: l, product: products.find(p => p.id === l.productId) }))
    .filter(r => r.product);
  const subtotal = rows.reduce((sum, r) => sum + r.product!.price * r.line.qty, 0);

  return (
    <AnimatePresence>
      {cart.isOpen && (
        <motion.div className="drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cart.close}>
          <motion.aside className="drawer" role="dialog" aria-label="Shopping bag" onClick={e => e.stopPropagation()}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 34 }}>
            <header className="drawer-head">
              <span>Your bag ({cart.count})</span>
              <button aria-label="Close bag" onClick={cart.close}><X size={20} /></button>
            </header>

            {rows.length === 0 ? (
              <div className="drawer-empty">
                <p>Your bag is empty.</p>
                <button className="btn-outline" onClick={cart.close}>Keep exploring</button>
              </div>
            ) : (
              <>
                <ul className="drawer-lines">
                  {rows.map(({ line, product }) => (
                    <li key={line.key}>
                      <img src={product!.frontImage} alt="" />
                      <div>
                        <strong>{product!.name}</strong>
                        <small>{line.color}</small>
                        <select className="size-select" aria-label="Size" value={line.size} onChange={e => cart.setSize(line.key, e.target.value)}>
                          {product!.sizes.map(sz => <option key={sz} value={sz}>Size {sz}</option>)}
                        </select>
                        <div className="qty qty-sm">
                          <button aria-label="Less" onClick={() => cart.setQty(line.key, line.qty - 1)}><Minus size={12} /></button>
                          <span>{line.qty}</span>
                          <button aria-label="More" onClick={() => cart.setQty(line.key, line.qty + 1)}><Plus size={12} /></button>
                        </div>
                      </div>
                      <div className="drawer-line-end">
                        <span>{formatPrice(product!.price * line.qty)}</span>
                        <button className="link-btn" onClick={() => cart.remove(line.key)}>Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <footer className="drawer-foot">
                  <div className="drawer-total"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                  <small>Shipping calculated at checkout.</small>
                  <Link href="/checkout" className="btn-primary" onClick={cart.close}>Checkout <ArrowRight size={16} /></Link>
                </footer>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
