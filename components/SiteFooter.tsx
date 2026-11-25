'use client';
import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import NotifyButton from './NotifyButton';
import { useI18n } from '@/lib/i18n/client';
import { useCategories, useProducts } from '@/lib/useProducts';
import { storeConfig } from '@/store.config';

const { brand, contact } = storeConfig;

export default function SiteFooter() {
  const { t, href } = useI18n();
  const products = useProducts();
  // only categories that have something in them
  const categories = useCategories().filter(c => products.some(p => p.categorySlug === c.slug));
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <strong className="brand">{brand.name}<span>.</span></strong>
        <small>© {new Date().getFullYear()} {brand.name}</small>
      </div>
      <div className="footer-contact">
        <span>{t.footer.followUs}</span>
        <a href={`mailto:${contact.email}`}><Mail size={14} strokeWidth={1.5} /> {contact.email}</a>
        <a href={`tel:${contact.phoneIntl}`}><Phone size={14} strokeWidth={1.5} /> {contact.phone}</a>
        <NotifyButton compact />
      </div>
      <nav>
        <Link href="/legal/shipping">{t.footer.shipping}</Link>
        <Link href="/legal/returns">{t.footer.returns}</Link>
        <Link href="/legal/terms">{t.footer.terms}</Link>
        <Link href="/legal/privacy">{t.footer.privacy}</Link>
        <Link href="/legal/accessibility">{t.footer.accessibility}</Link>
        <Link href={href('/account')}>{t.nav.account}</Link>
      </nav>
      {categories.length > 0 && (
        <nav className="footer-cats" aria-label={t.showcase.categories}>
          {categories.map(c => <Link key={c.slug} href={href(`/collections/${c.slug}`)} prefetch={false}>{c.name}</Link>)}
        </nav>
      )}
    </footer>
  );
}
