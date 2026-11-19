'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Minus, Plus, X } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useProducts } from '@/lib/useProducts';
import { useI18n } from '@/lib/i18n/client';

export default function CartDrawer() {
  const cart = useCart();
  const products = useProducts();
  const { t, href, name, price, color, dir } = useI18n();
  const from = dir === 'rtl' ? '-100%' : '100%';
  const rows = cart.lines
    .map(l => ({ line: l, product: products.find(p => p.id === l.productId) }))
    .filter(r => r.product);
  const subtotal = rows.reduce((sum, r) => sum + r.product!.price * r.line.qty, 0);

  return (
    <AnimatePresence>
      {cart.isOpen && (
        <motion.div className="drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cart.close}>
          <motion.aside className="drawer" role="dialog" aria-label={t.cart.label} onClick={e => e.stopPropagation()}
            initial={{ x: from }} animate={{ x: 0 }} exit={{ x: from }} transition={{ type: 'spring', stiffness: 300, damping: 34 }}>
            <header className="drawer-head">
              <span>{t.cart.title(cart.count)}</span>
              <button aria-label={t.cart.close} onClick={cart.close}><X size={20} /></button>
            </header>

            {rows.length === 0 ? (
              <div className="drawer-empty">
                <p>{t.cart.empty}</p>
                <button className="btn-outline" onClick={cart.close}>{t.cart.keepExploring}</button>
              </div>
            ) : (
              <>
                <ul className="drawer-lines">
                  {rows.map(({ line, product }) => (
                    <li key={line.key}>
                      <img src={product!.frontImage} alt="" />
                      <div>
                        <strong>{name(product!)}</strong>
                        <small>{color(line.color)}</small>
                        <select className="size-select" aria-label={t.cart.size} value={line.size} onChange={e => cart.setSize(line.key, e.target.value)}>
                          {product!.sizes.map(sz => <option key={sz} value={sz}>{t.cart.sizeOption(sz)}</option>)}
                        </select>
                        <div className="qty qty-sm">
                          <button aria-label={t.cart.less} onClick={() => cart.setQty(line.key, line.qty - 1)}><Minus size={12} /></button>
                          <span>{line.qty}</span>
                          <button aria-label={t.cart.more} onClick={() => cart.setQty(line.key, line.qty + 1)}><Plus size={12} /></button>
                        </div>
                      </div>
                      <div className="drawer-line-end">
                        <span>{price(product!.price * line.qty)}</span>
                        <button className="link-btn" onClick={() => cart.remove(line.key)}>{t.cart.remove}</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <footer className="drawer-foot">
                  <div className="drawer-total"><span>{t.cart.subtotal}</span><strong>{price(subtotal)}</strong></div>
                  <small>{t.cart.shippingNote}</small>
                  <Link href={href('/checkout')} className="btn-primary" onClick={cart.close}>{t.cart.checkout} <ArrowRight size={16} className="dir-icon" /></Link>
                </footer>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
