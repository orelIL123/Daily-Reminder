'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowRight, ChevronLeft, ChevronRight, MousePointer2 } from 'lucide-react';
import FlatRail from './FlatRail';
import type { Product } from '@/lib/products';
import { formatPrice } from '@/lib/money';
import { storeConfig } from '@/store.config';

/*
 * Section 2 — "The Straight Rail" showcase.
 * Serif title, a straight rail where one piece always faces you (glowing, "Featured"),
 * its name/price + CTAs underneath, dots and arrows to step along, and a category strip.
 */

const { showcase } = storeConfig;

const ICONS: Record<string, React.ReactNode> = {
  tee: <path d="M8 4l-5 3 2 4 3-1v10h10V10l3 1 2-4-5-3c-.5 1.6-2 2.6-4 2.6S8.5 5.6 8 4z" />,
  hoodie: <><path d="M9 4c0-1.2 1.4-2 3-2s3 .8 3 2l4 2 2 9-3 .5V21H6v-5.5L3 15l2-9 4-2z" /><path d="M9 4c0 2 1.3 4 3 4s3-2 3-4M11 8v3M13 8v3M8 17h8" /></>,
  jacket: <><path d="M9 3l3 2 3-2 4 2 2 10-3 .5V21H6v-5.5L3 15 5 5l4-2z" /><path d="M12 5v16M9 3l1 4M15 3l-1 4M8 14h2M14 14h2" /></>,
  cap: <><path d="M4 15c0-4.4 3.6-8 8-8s8 3.6 8 8" /><path d="M2 15h13c3 0 6 .8 7 2-2 .8-5 1-7 1H4c-1.1 0-2-.9-2-2v-1zM12 7V5.5" /></>,
};

const bgStyle = showcase.background
  ? ({ ['--sc-bg' as string]: `url('${showcase.background.light}')`, ['--sc-bg-dark' as string]: `url('${showcase.background.dark}')` } as React.CSSProperties)
  : undefined;

export default function RailShowcase({ products, onOpen }: { products: Product[]; onOpen: (p: Product) => void }) {
  const featuredId = useMemo(
    () => (products.find(p => p.id === showcase.featuredId) ?? products[Math.floor(products.length / 2)] ?? products[0])?.id,
    [products],
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const currentId = activeId ?? featuredId ?? null;
  const index = Math.max(0, products.findIndex(p => p.id === currentId));
  const current = products[index];

  const step = (d: number) => {
    if (!products.length) return;
    setActiveId(products[(index + d + products.length) % products.length].id);
  };

  return (
    <section id="rail-b" className={`showcase ${showcase.background ? 'has-bg' : ''}`} style={bgStyle} aria-labelledby="showcase-title">
      <div className="showcase-arch" aria-hidden="true" />

      <header className="showcase-head">
        <p className="showcase-eyebrow">
          {showcase.eyebrow.map((t, i) => <span key={t}>{i > 0 && <i />}{t}</span>)}
        </p>
        <h2 id="showcase-title">
          {showcase.title[0]} <em>{showcase.title[1]}</em> {showcase.title[2]}
        </h2>
        <div className="showcase-ornament" aria-hidden="true"><span /><b>✦</b><span /></div>
        <p className="showcase-sub">{showcase.subtitle}</p>
        <p className="showcase-steps">{showcase.steps.join(' · ')}</p>
      </header>

      <div className="showcase-stage">
        <button className="showcase-arrow is-prev" onClick={() => step(-1)} aria-label="Previous piece"><ChevronLeft size={18} strokeWidth={1.6} /></button>
        <FlatRail
          products={products}
          onOpen={onOpen}
          activeId={currentId}
          onActiveChange={id => id && setActiveId(id)}
          persistent
          featuredId={featuredId}
          showLabels={false}
          showHint={false}
        />
        <button className="showcase-arrow is-next" onClick={() => step(1)} aria-label="Next piece"><ChevronRight size={18} strokeWidth={1.6} /></button>
      </div>

      <div className="showcase-caption" aria-live="polite">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div key={current.id} className="showcase-caption-inner"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
              <h3>{current.name}</h3>
              <p>{formatPrice(current.price)}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="hero-ctas">
          {current && <button className="btn-primary" onClick={() => onOpen(current)}>Shop this piece <ArrowRight size={15} /></button>}
          <a className="btn-outline" href="#collection">Shop the collection <ArrowDown size={15} /></a>
        </div>
        <div className="rail3d-dots showcase-dots" role="tablist" aria-label="Pieces on the rail">
          {products.map((p, i) => (
            <button key={p.id} role="tab" aria-selected={i === index} aria-label={p.name} className={i === index ? 'is-active' : ''} onClick={() => setActiveId(p.id)} />
          ))}
        </div>
        <p className="showcase-hint"><span /> <MousePointer2 size={14} strokeWidth={1.5} /> <b className="hint-fine">Hover or drag the rail to explore</b><b className="hint-touch">Swipe the rail · tap to open</b> <span /></p>
      </div>

      <nav className="showcase-cats" aria-label="Shop by category">
        {showcase.categories.map(c => (
          <a key={c.label} href={c.href}>
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">{ICONS[c.icon]}</svg>
            <span><strong>{c.label}</strong><em>{c.note}</em></span>
          </a>
        ))}
      </nav>
    </section>
  );
}
