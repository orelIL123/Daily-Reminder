'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Product } from '@/lib/products';
import type { FlightOrigin } from '@/lib/flight';
import { useI18n } from '@/lib/i18n/client';
import { useCart } from '@/lib/cart';
import { isSoldOut } from '@/lib/useProducts';
import { track } from '@/lib/analytics/track';
import ProductInfo from './ProductInfo';

/*
 * Product focus view: the whole page blurs behind, the piece and its buy card stay sharp.
 */
const FLY_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const LIFT_EASE: [number, number, number, number] = [0.3, 0, 0.4, 1];

export default function ProductSheet({ product, origin, onClose }: { product: Product | null; origin?: FlightOrigin | null; onClose: () => void }) {
  const cart = useCart();
  const { t, name } = useI18n();
  const [view, setView] = useState<'front' | 'back'>('front');
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
    setView('front');
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [product, onClose]);

  const productId = product?.id;
  useEffect(() => { if (productId) track('product_view', { productId }); }, [productId]);

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

            <ProductInfo key={product.id} product={product} view={view} setView={setView} onAdded={() => { onClose(); cart.open(); }} />
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
