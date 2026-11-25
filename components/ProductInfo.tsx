'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Product } from '@/lib/products';
import { useI18n } from '@/lib/i18n/client';
import { useCart } from '@/lib/cart';
import { storeConfig } from '@/store.config';
import { isSoldOut, stockFor } from '@/lib/useProducts';

export type ProductViewSide = 'front' | 'back';

/**
 * Name, price, description, colour / size pickers and "Add to bag". Used by the quick view and the
 * product page. Give it `key={product.id}` so the choices reset between products.
 */
export default function ProductInfo({ product, view, setView, onAdded, heading: Heading = 'h2' }: {
  product: Product; view: ProductViewSide; setView: (v: ProductViewSide) => void; onAdded: () => void; heading?: 'h1' | 'h2';
}) {
  const cart = useCart();
  const { t, tr, name, price, description, category, color: colorName } = useI18n();
  const [size, setSize] = useState('');
  const [color, setColor] = useState(product.colors[0] ?? '');
  const [added, setAdded] = useState(false);

  function addToBag() {
    if (!size) return;
    cart.add({ productId: product.id, size, color, qty: 1 });
    setAdded(true);
    window.setTimeout(() => { setAdded(false); onAdded(); }, 650);
  }

  return (
    <div className="focus-info">
      {category(product) && <p className="focus-cat">{category(product)}</p>}
      <Heading className="focus-title">{name(product)}</Heading>
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
          const soldOut = stockFor(product, s, color) === 0;
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
  );
}
