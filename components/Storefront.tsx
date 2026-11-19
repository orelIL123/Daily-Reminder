'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';
import Rail3D from './Rail3D';
import FlatRail from './FlatRail';
import ProductSheet from './ProductSheet';
import { useProducts } from '@/lib/useProducts';
import { formatPrice } from '@/lib/money';
import type { Product } from '@/lib/products';
import { storeConfig } from '@/store.config';

const { brand, hero, rail } = storeConfig;
const heroStyle = hero.background
  ? ({ ['--hero-bg' as string]: `url('${hero.background.desktop}')`, ['--hero-bg-m' as string]: `url('${hero.background.mobile}')` } as React.CSSProperties)
  : undefined;

export default function Storefront() {
  const products = useProducts();
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<Product | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const current = products[active] ?? products[0];

  return (
    <>
      <section id="rail" className={`hero ${hero.background ? 'has-bg' : ''}`} style={heroStyle}>
        <div className="hero-eyebrow">{hero.eyebrow.map((t, i) => <span key={t}>{i > 0 && <i>|</i>}{t}</span>)}</div>

        {rail.layout !== 'straight' ? (
          <Rail3D products={products} onActiveChange={setActive} onOpen={setOpen} />
        ) : (
          <FlatRail products={products} onOpen={setOpen} />
        )}

        <div className="hero-caption" aria-live="polite">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div key={current.id} className="hero-caption-inner"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <span>{current.category}</span>
                <h1>{current.name}</h1>
                <p>{formatPrice(current.price)}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="hero-ctas">
            {current && <button className="btn-primary" onClick={() => setOpen(current)}>Shop this piece <ArrowRight size={15} /></button>}
            <a className="btn-outline" href="#collection">Shop the collection <ArrowDown size={15} /></a>
          </div>
        </div>
        <p className="hero-side-copy">{hero.sideCopy.map((l, i) => <span key={i}>{l}<br /></span>)}</p>
      </section>

      {rail.layout === 'both' && <section id="rail-b" className="rail-b">
        <header className="rail-b-head">
          <span className="eyebrow-sm">Option B</span>
          <h2>The straight rail</h2>
        </header>
        <FlatRail products={products} onOpen={setOpen} />
      </section>}

      <section id="collection" className="collection">
        <header className="section-head">
          <h2>The collection</h2>
          <span>{products.length} pieces</span>
        </header>
        <div className="grid">
          {products.map(p => (
            <button key={p.id} className="card" onClick={() => setOpen(p)}>
              <div className="card-img">
                <img src={p.frontImage} alt="" loading="lazy" />
                {(p.backImage || p.sideImage) && <img className="card-img-alt" src={p.backImage || p.sideImage} alt="" loading="lazy" />}
              </div>
              <div className="card-meta">
                <strong>{p.name}</strong>
                <span>{formatPrice(p.price)}</span>
              </div>
              <small>{p.colors.length} colors</small>
            </button>
          ))}
        </div>
      </section>

      <section id="about" className="about">
        <p>{brand.footerNote}</p>
      </section>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} {brand.name}</span>
        <nav><a href="#">Shipping</a><a href="#">Returns</a><a href="#">Terms</a><a href="#">Accessibility</a><a href="#">Contact</a></nav>
      </footer>

      <ProductSheet product={open} onClose={close} />
    </>
  );
}
