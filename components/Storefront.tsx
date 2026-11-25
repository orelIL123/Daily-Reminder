'use client';

import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Rail3D from './Rail3D';
import FlatRail from './FlatRail';
import RailShowcase from './RailShowcase';
import ProductSheet from './ProductSheet';
import Editorial from './Editorial';
import NotifyButton from './NotifyButton';
import ProductCard from './ProductCard';
import SiteFooter from './SiteFooter';
import { useCategories, useProducts } from '@/lib/useProducts';
import { useFilter } from '@/lib/filter';
import { useI18n } from '@/lib/i18n/client';
import type { Product } from '@/lib/products';
import type { FlightOrigin } from '@/lib/flight';
import { storeConfig } from '@/store.config';

const { brand, hero, rail } = storeConfig;
const heroStyle = hero.background
  ? ({ ['--hero-bg' as string]: `url('${hero.background.desktop}')`, ['--hero-bg-m' as string]: `url('${hero.background.mobile}')` } as React.CSSProperties)
  : undefined;

export default function Storefront() {
  const products = useProducts();
  const categories = useCategories();
  const { category, showCategory } = useFilter();
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<Product | null>(null);
  const [origin, setOrigin] = useState<FlightOrigin | null>(null);
  const reduce = useReducedMotion();
  const close = useCallback(() => setOpen(null), []);
  // open the product view; `from` = where the piece hung, so its picture can fly into the view
  const openWith = useCallback((p: Product, from?: FlightOrigin) => { setOrigin(reduce ? null : from ?? null); setOpen(p); }, [reduce]);
  const hiddenId = open && origin ? open.id : null;
  const current = products[active] ?? products[0];
  const { t, tr, name, price } = useI18n();

  const shown = useMemo(() => (category ? products.filter(p => p.categorySlug === category) : products), [products, category]);
  const activeCat = categories.find(c => c.slug === category);

  return (
    <>
      <section id="rail" className={`hero ${hero.background ? 'has-bg' : ''}`} style={heroStyle}>
        <h1 className="sr-only">{brand.name}</h1>

        {rail.layout !== 'straight' ? (
          <Rail3D products={products} onActiveChange={setActive} onOpen={openWith} hiddenProductId={hiddenId} />
        ) : (
          <FlatRail products={products} onOpen={openWith} hiddenId={hiddenId} />
        )}

        <div className="hero-caption" aria-live="polite">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div key={current.id} className="hero-caption-inner"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <h2>{name(current)}</h2>
                <p>{price(current.price)}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {rail.layout === 'both' && <RailShowcase products={products} onOpen={openWith} hiddenId={hiddenId} />}

      <Editorial />

      <section id="collection" className="collection">
        <header className="section-head">
          <h2>{activeCat ? activeCat.name : t.collection.title}</h2>
          <span>{t.collection.pieces(shown.length)}</span>
        </header>
        <div className="cat-chips" role="toolbar" aria-label={t.collection.filter}>
          <button className={!category ? 'is-on' : ''} aria-pressed={!category} onClick={() => showCategory(null)}>{t.collection.all}</button>
          {categories.map(c => (
            <button key={c.slug} className={category === c.slug ? 'is-on' : ''} aria-pressed={category === c.slug} onClick={() => showCategory(c.slug)}>{c.name}</button>
          ))}
        </div>
        {shown.length === 0 ? (
          <div className="collection-empty">
            <p>{t.collection.comingSoon}</p>
            <NotifyButton />
          </div>
        ) : (
          <div className="grid">
            {shown.map(p => <ProductCard key={p.id} product={p} onOpen={openWith} />)}
          </div>
        )}
      </section>

      <section id="about" className="about">
        <p>{tr(brand.footerNote)}</p>
      </section>

      <SiteFooter />

      <ProductSheet product={open} origin={origin} onClose={close} />
    </>
  );
}
