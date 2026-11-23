'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, ShoppingBag, User, X } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useI18n } from '@/lib/i18n/client';
import { useCategories } from '@/lib/useProducts';
import { useFilter } from '@/lib/filter';
import { storeConfig } from '@/store.config';
import CategoryIcon from './CategoryIcon';

export default function SiteHeader() {
  const cart = useCart();
  const { t, href } = useI18n();
  const categories = useCategories();
  const { showCategory } = useFilter();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  const pick = (slug: string | null) => { setMenu(false); showCategory(slug); };

  return (
    <>
      <header className="site-header">
        <div className="header-start">
          <button className="menu-btn" aria-label={t.nav.menu} aria-expanded={menu} onClick={() => setMenu(true)}><Menu size={20} strokeWidth={1.5} /></button>
          <nav className="nav-links" aria-label={t.nav.main}>
            <Link href={href('/') + '#rail'}>{t.nav.newIn}</Link>
            <button onClick={() => pick(null)}>{t.nav.shopAll}</button>
            <Link href={href('/') + '#editorial'}>{storeConfig.editorial.eyebrow}</Link>
          </nav>
        </div>
        <Link href={href('/')} className="brand" aria-label={t.nav.home}>{storeConfig.brand.name}{storeConfig.brand.accentDot && <span>.</span>}</Link>
        <div className="header-actions">
          <Link href={href('/account')} aria-label={t.nav.account}><User size={18} strokeWidth={1.5} /></Link>
          <button aria-label={t.nav.bag(cart.count)} className="bag-btn" onClick={cart.open}>
            <ShoppingBag size={18} strokeWidth={1.5} />
            {cart.count > 0 && <span className="bag-count">{cart.count}</span>}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div className="menu-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(false)}>
            <motion.aside className="menu-panel" role="dialog" aria-label={t.nav.menu} onClick={e => e.stopPropagation()}
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 320, damping: 36 }}>
              <header>
                <span className="brand">{storeConfig.brand.name}<span>.</span></span>
                <button aria-label={t.nav.closeMenu} onClick={() => setMenu(false)}><X size={20} /></button>
              </header>
              <nav>
                <button className="menu-all" onClick={() => pick(null)}>{t.nav.shopAll}</button>
                {categories.map(c => (
                  <button key={c.slug} onClick={() => pick(c.slug)}><CategoryIcon slug={c.slug} size={24} /> {c.name}</button>
                ))}
              </nav>
              <footer>
                <Link href={href('/') + '#editorial'} onClick={() => setMenu(false)}>{storeConfig.editorial.eyebrow} — {storeConfig.editorial.title}</Link>
                <Link href={href('/account')} onClick={() => setMenu(false)}>{t.nav.account}</Link>
                <a href={`mailto:${storeConfig.contact.email}`}>{storeConfig.contact.email}</a>
                <a href={`tel:${storeConfig.contact.phoneIntl}`}>{storeConfig.contact.phone}</a>
              </footer>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
