'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import ProductCard from './ProductCard';
import ProductSheet from './ProductSheet';
import NotifyButton from './NotifyButton';
import { useCategories, useProducts } from '@/lib/useProducts';
import { useI18n } from '@/lib/i18n/client';
import type { Product } from '@/lib/products';

export default function CollectionPage({ slug }: { slug: string }) {
  const { t, href } = useI18n();
  const category = useCategories().find(c => c.slug === slug);
  const shown = useProducts().filter(p => p.categorySlug === slug);
  const [open, setOpen] = useState<Product | null>(null);
  const close = useCallback(() => setOpen(null), []);
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href={href('/')}>{t.nav.home}</Link><i>/</i><span aria-current="page">{category?.name}</span>
        </nav>
        <section className="collection collection-page">
          <header className="section-head"><h1>{category?.name}</h1><span>{t.collection.pieces(shown.length)}</span></header>
          {shown.length === 0 ? (
            <div className="collection-empty"><p>{t.collection.comingSoon}</p><NotifyButton /></div>
          ) : (
            <div className="grid">{shown.map(p => <ProductCard key={p.id} product={p} onOpen={setOpen} />)}</div>
          )}
        </section>
      </main>
      <SiteFooter />
      <ProductSheet product={open} onClose={close} />
    </div>
  );
}
