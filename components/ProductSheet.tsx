'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { Product } from '@/lib/products';
import { formatPrice } from '@/lib/money';
import { useCart } from '@/lib/cart';
import { storeConfig } from '@/store.config';
import { stockFor } from '@/lib/useProducts';

/*
 * Product focus view: the whole page blurs behind, the piece and its buy card stay sharp.
 */
export default function ProductSheet({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const cart = useCart();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [view, setView] = useState<'front' | 'back'>('front');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!product) return;
    setSize(''); setColor(product.colors[0] ?? ''); setView('front'); setAdded(false);
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [product, onClose]);

  function addToBag() {
    if (!product || !size) return;
    cart.add({ productId: product.id, size, color, qty: 1 });
    setAdded(true);
    window.setTimeout(() => { onClose(); cart.open(); }, 650);
  }

  const back = product ? (product.backImage || product.sideImage || product.frontImage) : '';
  const mirrored = product ? !product.backImage && !product.sideImage : false;

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="focus"
          role="dialog" aria-modal="true" aria-label={product.name}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
          onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <button className="focus-close" aria-label="Close" onClick={onClose}><X size={20} /></button>

          <motion.div
            className="focus-card"
            initial={{ y: 30, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          >
            <div className="focus-visual">
              <motion.img
                className="focus-img" src={product.frontImage} alt={`${product.name} — front`}
                initial={false}
                animate={{ opacity: view === 'front' ? 1 : 0, rotateY: view === 'front' ? 0 : -70 }}
                transition={{ type: 'spring', stiffness: 130, damping: 20 }}
              />
              <motion.img
                className={`focus-img ${mirrored ? 'is-mirrored' : ''}`} src={back} alt={`${product.name} — back`}
                initial={false}
                animate={{ opacity: view === 'back' ? 1 : 0, rotateY: view === 'back' ? 0 : 70 }}
                transition={{ type: 'spring', stiffness: 130, damping: 20 }}
              />
            </div>

            <div className="focus-info">
              <h2>{product.name}</h2>
              <p className="focus-price">{formatPrice(product.price)}</p>

              <div className="seg" role="tablist" aria-label="View">
                <motion.span className="seg-pill" layout transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  style={{ left: view === 'front' ? 3 : '50%' }} />
                <button role="tab" aria-selected={view === 'front'} className={view === 'front' ? 'is-on' : ''} onClick={() => setView('front')}>Front</button>
                <button role="tab" aria-selected={view === 'back'} className={view === 'back' ? 'is-on' : ''} onClick={() => setView('back')}>Back</button>
              </div>

              {product.colors.length > 1 && (
                <div className="color-pills" role="radiogroup" aria-label="Color">
                  {product.colors.map(c => (
                    <button key={c} role="radio" aria-checked={c === color} className={c === color ? 'is-on' : ''}
                      onClick={() => { setColor(c); setSize(''); }}>{c}</button>
                  ))}
                </div>
              )}

              <div className="size-pills" role="radiogroup" aria-label="Size">
                {product.sizes.map(s => {
                  const left = stockFor(product, s, color);
                  const soldOut = left === 0;
                  return (
                    <button key={s} role="radio" aria-checked={s === size} disabled={soldOut}
                      aria-label={soldOut ? `${s} — sold out` : s}
                      className={`${s === size ? 'is-on' : ''} ${soldOut ? 'is-out' : ''}`} onClick={() => setSize(s)}>{s}</button>
                  );
                })}
              </div>
              {size && (() => { const left = stockFor(product, size, color); return left !== null && left > 0 && left <= 3
                ? <p className="focus-low">Only {left} left in {size}</p> : null; })()}
              {product.variants && product.variants.every(v => v.stock === 0) && <p className="focus-low">Sold out</p>}

              <button className={`focus-cta ${size ? 'is-ready' : ''} ${added ? 'is-added' : ''}`} disabled={!size || added} onClick={addToBag}>
                {added ? <><Check size={16} /> Added</> : size ? `Add to bag — ${formatPrice(product.price)}` : 'Select a size'}
              </button>
              <p className="focus-note">{storeConfig.commerce.perks.join(' · ')}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
