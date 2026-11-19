'use client';

import Link from 'next/link';
import { Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/lib/cart';

export default function SiteHeader() {
  const cart = useCart();
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Home">ATELIER<span>.</span></Link>
      <nav className="nav-links" aria-label="Main">
        <Link href="/#rail">New in</Link>
        <Link href="/#collection">Shop all</Link>
        <Link href="/#about">About</Link>
      </nav>
      <div className="header-actions">
        <button aria-label="Search"><Search size={18} strokeWidth={1.6} /></button>
        <Link href="/admin" aria-label="Account / admin"><User size={18} strokeWidth={1.6} /></Link>
        <button aria-label={`Bag, ${cart.count} items`} className="bag-btn" onClick={cart.open}>
          <ShoppingBag size={18} strokeWidth={1.6} />
          {cart.count > 0 && <span className="bag-count">{cart.count}</span>}
        </button>
      </div>
    </header>
  );
}
