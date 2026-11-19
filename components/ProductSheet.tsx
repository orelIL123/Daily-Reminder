'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Minus, Plus, X } from 'lucide-react';
import type { Product } from '@/lib/products';
import { formatPrice } from '@/lib/money';
import { useCart } from '@/lib/cart';

const SWATCH: Record<string, string> = {
  cream: '#e6dfcf', ecru: '#e6dfcf', white: '#f5f3ed', forest: '#204b39', stone: '#aaa69b',
  charcoal: '#36383b', ash: '#969793', slate: '#686e72', navy: '#202e3f', black: '#191919',
};

export default function ProductSheet({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const cart = useCart();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [view, setView] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!product) return;
    setSize(''); setColor(product.colors[0] ?? ''); setQty(1); setView(0); setError('');
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [product, onClose]);

  function addToBag() {
    if (!product) return;
    if (!size) { setError('Please choose a size'); return; }
    cart.add({ productId: product.id, size, color, qty });
    onClose();
    cart.open();
  }

  const views = product
    ? (product.sideImage && product.backImage ? [product.frontImage, product.sideImage, product.backImage] : [product.frontImage, product.backImage || product.sideImage || product.frontImage])
    : [];
  const viewNames = views.length === 3 ? ['Front', 'Side', 'Back'] : ['Front', 'Back'];

  return (
    <AnimatePresence>
      {product && (
        <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.section className="sheet" role="dialog" aria-modal="true" aria-label={product.name}
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
            <button className="sheet-close" aria-label="Close" onClick={onClose}><X size={20} /></button>

            <div className="sheet-visual">
              <div className="sheet-turn">
                {views.map((src, i) => (
                  <motion.img key={src + i} className="sheet-face" src={src} alt={i === 0 ? product.name : ''}
                    initial={false}
                    animate={{ opacity: view === i ? 1 : 0, rotateY: view === i ? 0 : i > view ? -60 : 60, scale: view === i ? 1 : 0.95 }}
                    transition={{ type: 'spring', stiffness: 110, damping: 17 }} />
                ))}
              </div>
              <div className="sheet-views" role="tablist" aria-label="View">
                {views.map((_, i) => (
                  <button key={i} role="tab" aria-selected={view === i} className={view === i ? 'is-on' : ''} onClick={() => setView(i)}>{viewNames[i]}</button>
                ))}
              </div>
            </div>

            <div className="sheet-info">
              <span className="eyebrow-sm">{product.category}</span>
              <h2>{product.name}</h2>
              <div className="sheet-price">{formatPrice(product.price)}</div>
              <p className="sheet-desc">{product.description}</p>

              <div className="field-label">Color — <strong>{color}</strong></div>
              <div className="swatches">
                {product.colors.map(c => (
                  <button key={c} aria-label={c} aria-pressed={c === color} className={c === color ? 'is-on' : ''}
                    style={{ background: SWATCH[c.toLowerCase()] ?? '#bbb' }} onClick={() => setColor(c)} />
                ))}
              </div>

              <div className="field-label">Size {error && <span className="field-error">{error}</span>}</div>
              <div className="sizes">
                {product.sizes.map(s => (
                  <button key={s} className={s === size ? 'is-on' : ''} aria-pressed={s === size} onClick={() => { setSize(s); setError(''); }}>{s}</button>
                ))}
              </div>

              <div className="sheet-buy">
                <div className="qty">
                  <button aria-label="Less" onClick={() => setQty(q => Math.max(1, q - 1))}><Minus size={14} /></button>
                  <span>{qty}</span>
                  <button aria-label="More" onClick={() => setQty(q => Math.min(20, q + 1))}><Plus size={14} /></button>
                </div>
                <button className="btn-primary" onClick={addToBag}>
                  Add to bag — {formatPrice(product.price * qty)} <ArrowRight size={16} />
                </button>
              </div>
              <ul className="sheet-perks">
                <li>Free shipping over ₪350</li>
                <li>14-day returns</li>
                <li>Secure checkout</li>
              </ul>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
