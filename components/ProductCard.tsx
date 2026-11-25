'use client';
import Link from 'next/link';
import type { Product } from '@/lib/products';
import { isSoldOut } from '@/lib/useProducts';
import { useI18n } from '@/lib/i18n/client';
import { productPath } from '@/lib/seo';

/**
 * A product in a grid. A real link to the product page (so it can be indexed and shared);
 * with `onOpen`, a plain click opens the quick view instead.
 */
export default function ProductCard({ product: p, onOpen }: { product: Product; onOpen?: (p: Product) => void }) {
  const { t, name, price, href } = useI18n();
  const soldOut = isSoldOut(p);
  return (
    <Link href={href(productPath(p))} prefetch={false} className={`card ${soldOut ? 'is-soldout' : ''}`}
      onClick={e => {
        if (!onOpen || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault(); onOpen(p);
      }}>
      <div className="card-img">
        {soldOut && <span className="soldout-tag">{t.product.soldOut}</span>}
        <img src={p.frontImage} alt={name(p)} loading="lazy" />
        {(p.backImage || p.sideImage) && <img className="card-img-alt" src={p.backImage || p.sideImage} alt="" loading="lazy" />}
      </div>
      <div className="card-meta">
        <strong>{name(p)}</strong>
        <span>{soldOut ? <s>{price(p.price)}</s> : price(p.price)}</span>
      </div>
      <small>{t.collection.colors(p.colors.length)}</small>
    </Link>
  );
}
