'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { Product } from '@/lib/products';
import type { FlightOrigin } from '@/lib/flight';
import { useI18n } from '@/lib/i18n/client';
import { useCart } from '@/lib/cart';
import { storeConfig } from '@/store.config';
import { isSoldOut, stockFor } from '@/lib/useProducts';

/*
 * Product focus view: the whole page blurs behind, the piece and its buy card stay sharp.
 */
const FLY_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const LIFT_EASE: [number, number, number, number] = [0.3, 0, 0.4, 1];

export default function ProductSheet({ product, origin, onClose }: { product: Product | null; origin?: FlightOrigin | null; onClose: () => void }) {
  const cart = useCart();
  const { t, tr, name, price, description, category, color: colorName } = useI18n();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [view, setView] = useState<'front' | 'back'>('front');
  const [added, setAdded] = useState(false);
  const reduce = useReducedMotion();
  const visualRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<DOMRect | null>(null);
  const [flying, setFlying] = useState(false);

  // the picture lifts off the hanger and glides to its place in this view
  useLayoutEffect(() => {
    if (!product || !origin || reduce) { setTarget(null); setFlying(false); return; }
    const r = visualRef.current?.getBoundingClientRect();
    if (r && r.width > 0) { setTarget(r); setFlying(true); } else setFlying(false);
  }, [product, origin, reduce]);
  const fly = !!(origin && !reduce);

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
    <>
    <AnimatePresence>
      {product && (
        <motion.div
          className="focus"
          role="dialog" aria-modal="true" aria-label={name(product)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
          onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <button className="focus-close" aria-label={t.product.close} onClick={onClose}><X size={20} /></button>

          <motion.div
            className="focus-card"
            initial={fly ? { opacity: 0 } : { y: 30, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          >
            <div ref={visualRef} className={`focus-visual ${isSoldOut(product) ? 'is-soldout' : ''}`}>
              {isSoldOut(product) && <span className="soldout-tag">{t.product.soldOut}</span>}
              <motion.img
                className="focus-img" src={product.frontImage} alt={t.product.frontAlt(name(product))}
                style={{ visibility: flying ? 'hidden' : 'visible' }}
                initial={false}
                animate={{ opacity: view === 'front' ? 1 : 0, rotateY: view === 'front' ? 0 : -70 }}
                transition={{ type: 'spring', stiffness: 130, damping: 20 }}
              />
              <motion.img
                className={`focus-img ${mirrored ? 'is-mirrored' : ''}`} src={back} alt={t.product.backAlt(name(product))}
                initial={false}
                animate={{ opacity: view === 'back' ? 1 : 0, rotateY: view === 'back' ? 0 : 70 }}
                transition={{ type: 'spring', stiffness: 130, damping: 20 }}
              />
            </div>

            <div className="focus-info">
              {category(product) && <p className="focus-cat">{category(product)}</p>}
              <h2>{name(product)}</h2>
              <p className="focus-price">
                {product.compareAtPrice && product.compareAtPrice > product.price && <s>{price(product.compareAtPrice)}</s>}
                {price(product.price)}
              </p>
              {description(product) && (
                <div className="focus-desc">
                  <span>{t.product.description}</span>
                  <p>{description(product)}</p>
                </div>
              )}

              <div className="seg" role="tablist" aria-label={t.product.view}>
                <motion.span className="seg-pill" layout transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  style={{ insetInlineStart: view === 'front' ? 3 : '50%' }} />
                <button role="tab" aria-selected={view === 'front'} className={view === 'front' ? 'is-on' : ''} onClick={() => setView('front')}>{t.product.front}</button>
                <button role="tab" aria-selected={view === 'back'} className={view === 'back' ? 'is-on' : ''} onClick={() => setView('back')}>{t.product.back}</button>
              </div>

              {product.colors.length > 1 && (
                <div className="color-pills" role="radiogroup" aria-label={t.product.color}>
                  {product.colors.map(c => (
                    <button key={c} role="radio" aria-checked={c === color} className={c === color ? 'is-on' : ''}
                      onClick={() => { setColor(c); setSize(''); }}>{colorName(c)}</button>
                  ))}
                </div>
              )}

              <div className="size-pills" role="radiogroup" aria-label={t.product.size}>
                {product.sizes.map(s => {
                  const left = stockFor(product, s, color);
                  const soldOut = left === 0;
                  return (
                    <button key={s} role="radio" aria-checked={s === size} disabled={soldOut}
                      aria-label={soldOut ? t.product.soldOutSize(s) : s}
                      className={`${s === size ? 'is-on' : ''} ${soldOut ? 'is-out' : ''}`} onClick={() => setSize(s)}>{s}</button>
                  );
                })}
              </div>
              {size && (() => { const left = stockFor(product, size, color); return left !== null && left > 0 && left <= 3
                ? <p className="focus-low">{t.product.onlyLeft(left, size)}</p> : null; })()}

              <button className={`focus-cta ${size ? 'is-ready' : ''} ${added ? 'is-added' : ''} ${isSoldOut(product) ? 'is-soldout' : ''}`} disabled={!size || added || isSoldOut(product)} onClick={addToBag}>
                {isSoldOut(product) ? t.product.soldOut : added ? <><Check size={16} /> {t.product.added}</> : size ? t.product.addToBag(price(product.price)) : t.product.selectSize}
              </button>
              <p className="focus-note">{storeConfig.commerce.perks.map(tr).join(' · ')}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    {product && origin && target && flying && createPortal(
      <motion.img
          key={`fly-${product.id}`}
          src={origin.src} alt="" aria-hidden="true" draggable={false}
          className="fly-img"
          style={{ left: target.left, top: target.top, width: target.width, height: target.height }}
          initial={{ x: origin.rect.left - target.left, y: origin.rect.top - target.top, scale: origin.rect.width / target.width }}
          animate={{ x: 0, y: [origin.rect.top - target.top, origin.rect.top - target.top - 26, 0], scale: 1 }}
          transition={{ duration: 0.85, ease: FLY_EASE, y: { duration: 0.85, times: [0, 0.22, 1], ease: [LIFT_EASE, FLY_EASE] } }}
          onAnimationComplete={() => setFlying(false)}
      />,
      document.body,
    )}
    </>
  );
}
