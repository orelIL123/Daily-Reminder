import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import Storefront from '@/components/Storefront';
import JsonLd from '@/components/JsonLd';
import { getSettings, siteUrl } from '@/lib/settings';
import { defaultHomeDescription } from '@/lib/seo';
import { storeConfig } from '@/store.config';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function Home() {
  const { seo } = await getSettings();
  const base = siteUrl(seo);
  const { brand, contact } = storeConfig;
  return (
    <div className="site-shell">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'OnlineStore', '@id': `${base}/#store`, name: brand.name, url: base,
            logo: `${base}/icons/icon-512.png`, image: new URL(seo.ogImage, base).toString(),
            description: seo.homeDescription || defaultHomeDescription(),
            email: contact.email, telephone: contact.phoneIntl,
            sameAs: [seo.instagram, seo.tiktok].filter(u => /^https:\/\//.test(u)),
          },
          { '@type': 'WebSite', '@id': `${base}/#website`, url: base, name: brand.name, publisher: { '@id': `${base}/#store` } },
        ],
      }} />
      <SiteHeader />
      <main><Storefront /></main>
    </div>
  );
}
