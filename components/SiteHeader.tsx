'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useI18n } from '@/lib/i18n/client';
import { localePath, stripLocale } from '@/lib/i18n/config';
import { storeConfig } from '@/store.config';
import ThemeToggle from './ThemeToggle';

export default function SiteHeader() {
  const cart = useCart();
  const { t, href, lang } = useI18n();
  const pathname = usePathname() || '/';
  const other = lang === 'he' ? 'en' : 'he';
  const switchHref = localePath(other, stripLocale(pathname));

  return (
    <header className="site-header">
      <Link href={href('/')} className="brand" aria-label={t.nav.home}><bdi dir="ltr">{storeConfig.brand.name}{storeConfig.brand.accentDot && <span>.</span>}</bdi></Link>
      <nav className="nav-links" aria-label={t.nav.main}>
        <Link href={href('/') + '#rail'}>{t.nav.newIn}</Link>
        <Link href={href('/') + '#collection'}>{t.nav.shopAll}</Link>
        <Link href={href('/') + '#about'}>{t.nav.about}</Link>
      </nav>
      <div className="header-actions">
        <Link href={switchHref} className="lang-switch" hrefLang={other} lang={other} aria-label={t.nav.switchToLabel}>{t.nav.switchTo}</Link>
        <ThemeToggle />
        <button className="search-btn" aria-label={t.nav.search}><Search size={18} strokeWidth={1.6} /></button>
        <Link href="/admin" aria-label={t.nav.account}><User size={18} strokeWidth={1.6} /></Link>
        <button aria-label={t.nav.bag(cart.count)} className="bag-btn" onClick={cart.open}>
          <ShoppingBag size={18} strokeWidth={1.6} />
          {cart.count > 0 && <span className="bag-count">{cart.count}</span>}
        </button>
      </div>
    </header>
  );
}
