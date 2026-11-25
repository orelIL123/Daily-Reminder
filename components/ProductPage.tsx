'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import ProductInfo, { type ProductViewSide } from './ProductInfo';
import ProductCard from './ProductCard';
import { isSoldOut, useProducts } from '@/lib/useProducts';
import { useCart } from '@/lib/cart';
import { useI18n } from '@/lib/i18n/client';
import { track } from '@/lib/analytics/track';

export default function ProductPage({ id }: { id: string }) {
  const products = useProducts();
  const cart = useCart();
  const { t, name, category, href } = useI18n();
  const [view, setView] = useState<ProductViewSide>('front');
  const product = products.find(p => p.id === id);

  useEffect(() => { setView('front'); track('product_view', { productId: id }); }, [id]);
  if (!product) return null;

  const back = product.backImage || product.sideImage || product.frontImage;
  const mirrored = !product.backImage && !product.sideImage;
  const more = products.filter(p => p.id !== id)
    .sort((a, b) => Number(b.categorySlug === product.categorySlug) - Number(a.categorySlug === product.categorySlug)).slice(0, 4);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href={href('/')}>{t.nav.home}</Link>
          {product.categorySlug && <><i>/</i><Link href={href(`/collections/${product.categorySlug}`)}>{category(product)}</Link></>}
          <i>/</i><span aria-current="page">{name(product)}</span>
        </nav>
        <article className="pdp">
          <div className={`focus-visual pdp-visual ${isSoldOut(product) ? 'is-soldout' : ''}`}>
            {isSoldOut(product) && <span className="soldout-tag">{t.product.soldOut}</span>}
            <img className="focus-img pdp-img" src={product.frontImage} alt={t.product.frontAlt(name(product))} style={{ opacity: view === 'front' ? 1 : 0 }} />
            <img className={`focus-img pdp-img ${mirrored ? 'is-mirrored' : ''}`} src={back} alt={t.product.backAlt(name(product))} style={{ opacity: view === 'back' ? 1 : 0 }} />
          </div>
          <ProductInfo key={product.id} product={product} view={view} setView={setView} onAdded={cart.open} heading="h1" />
        </article>
        {more.length > 0 && (
          <section className="collection">
            <header className="section-head"><h2>{t.collection.more}</h2></header>
            <div className="grid">{more.map(p => <ProductCard key={p.id} product={p} />)}</div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
