'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';
import Rail3D from './Rail3D';
import FlatRail from './FlatRail';
import RailShowcase from './RailShowcase';
import ProductSheet from './ProductSheet';
import { useProducts } from '@/lib/useProducts';
import { useI18n } from '@/lib/i18n/client';
import type { Product } from '@/lib/products';
import { storeConfig } from '@/store.config';

const { brand, hero, rail } = storeConfig;
const heroStyle = hero.background
  ? ({
      ['--hero-bg' as string]: `url('${hero.background.desktop}')`,
      ['--hero-bg-m' as string]: `url('${hero.background.mobile}')`,
      ...(hero.backgroundDark ? {
        ['--hero-bg-dark' as string]: `url('${hero.backgroundDark.desktop}')`,
        ['--hero-bg-dark-m' as string]: `url('${hero.backgroundDark.mobile}')`,
      } : {}),
    } as React.CSSProperties)
  : undefined;

export default function Storefront() {
  const products = useProducts();
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<Product | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const current = products[active] ?? products[0];
  const { t, tr, name, price, category } = useI18n();
  const Arrow = ArrowRight;

  return (
    <>
      <section id="rail" className={`hero ${hero.background ? 'has-bg' : ''}`} style={heroStyle}>
        <div className="hero-eyebrow">{hero.eyebrow.map((e, i) => <span key={e.en}>{i > 0 && <i>|</i>}{tr(e)}</span>)}</div>

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
                <span>{category(current)}</span>
                <h1>{name(current)}</h1>
                <p>{price(current.price)}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="hero-ctas">
            {current && <button className="btn-primary" onClick={() => setOpen(current)}>{t.cta.shopPiece} <Arrow size={15} className="dir-icon" /></button>}
            <a className="btn-outline" href="#collection">{t.cta.shopCollection} <ArrowDown size={15} /></a>
          </div>
        </div>
        <p className="hero-side-copy">{hero.sideCopy.map((l, i) => <span key={i}>{tr(l)}<br /></span>)}</p>
      </section>

      {rail.layout === 'both' && <RailShowcase products={products} onOpen={setOpen} />}

      <section id="collection" className="collection">
        <header className="section-head">
          <h2>{t.collection.title}</h2>
          <span>{t.collection.pieces(products.length)}</span>
        </header>
        <div className="grid">
          {products.map(p => (
            <button key={p.id} className="card" onClick={() => setOpen(p)}>
              <div className="card-img">
                <img src={p.frontImage} alt="" loading="lazy" />
                {(p.backImage || p.sideImage) && <img className="card-img-alt" src={p.backImage || p.sideImage} alt="" loading="lazy" />}
              </div>
              <div className="card-meta">
                <strong>{name(p)}</strong>
                <span>{price(p.price)}</span>
              </div>
              <small>{t.collection.colors(p.colors.length)}</small>
            </button>
          ))}
        </div>
      </section>

      <section id="about" className="about">
        <p>{tr(brand.footerNote)}</p>
      </section>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} {brand.name}</span>
        <nav><a href="#">{t.footer.shipping}</a><a href="#">{t.footer.returns}</a><a href="#">{t.footer.terms}</a><a href="#">{t.footer.accessibility}</a><a href="#">{t.footer.contact}</a></nav>
      </footer>

      <ProductSheet product={open} onClose={close} />
    </>
  );
}
