'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FlatRail from './FlatRail';
import type { Product } from '@/lib/products';
import type { FlightOrigin } from '@/lib/flight';
import { useI18n } from '@/lib/i18n/client';
import { storeConfig } from '@/store.config';
import { useCategories } from '@/lib/useProducts';
import { useFilter } from '@/lib/filter';
import CategoryIcon from './CategoryIcon';

/*
 * Section 2 — the straight rail.
 * Soft white studio, a straight silver rail where one piece always faces you, its name + price underneath,
 * dots and arrows to step along, and a quiet category strip.
 */

const { showcase } = storeConfig;

const bgStyle = showcase.background ? ({ ['--sc-bg' as string]: `url('${showcase.background}')` } as React.CSSProperties) : undefined;

export default function RailShowcase({ products, onOpen, hiddenId }: { products: Product[]; onOpen: (p: Product, origin?: FlightOrigin) => void; hiddenId?: string | null }) {
  const featuredId = useMemo(
    () => (products.find(p => p.id === showcase.featuredId) ?? products[Math.floor(products.length / 2)] ?? products[0])?.id,
    [products],
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const { t, name, price } = useI18n();
  const categories = useCategories();
  const { showCategory } = useFilter();
  const currentId = activeId ?? featuredId ?? null;
  const index = Math.max(0, products.findIndex(p => p.id === currentId));
  const current = products[index];

  const step = (d: number) => {
    if (!products.length) return;
    setActiveId(products[(index + d + products.length) % products.length].id);
  };

  return (
    <section id="rail-b" className={`showcase ${showcase.background ? 'has-bg' : ''}`} style={bgStyle} aria-label={t.rail.region}>
      <div className="showcase-stage" dir="ltr">
        <button className="showcase-arrow is-prev" onClick={() => step(-1)} aria-label={t.rail.prev}><ChevronLeft size={18} strokeWidth={1.6} /></button>
        <FlatRail
          products={products}
          onOpen={onOpen}
          hiddenId={hiddenId}
          activeId={currentId}
          onActiveChange={id => id && setActiveId(id)}
          persistent
          showLabels={false}
          showHint={false}
        />
        <button className="showcase-arrow is-next" onClick={() => step(1)} aria-label={t.rail.next}><ChevronRight size={18} strokeWidth={1.6} /></button>
      </div>

      <div className="showcase-caption" aria-live="polite">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div key={current.id} className="showcase-caption-inner"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
              <h3>{name(current)}</h3>
              <p>{price(current.price)}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="rail3d-dots showcase-dots" role="tablist" dir="ltr" aria-label={t.rail.piecesOnRail}>
          {products.map((p, i) => (
            <button key={p.id} role="tab" aria-selected={i === index} aria-label={name(p)} className={i === index ? 'is-active' : ''} onClick={() => setActiveId(p.id)} />
          ))}
        </div>
      </div>

      <nav className="showcase-cats" aria-label={t.showcase.categories}>
        {categories.map(c => (
          <button key={c.slug} onClick={() => showCategory(c.slug)}>
            <CategoryIcon slug={c.slug} />
            <span><strong>{c.name}</strong></span>
          </button>
        ))}
      </nav>
    </section>
  );
}
