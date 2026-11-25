import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import Providers from '@/components/Providers';
import { storeConfig, RAIL_FINISHES } from '@/store.config';
import { getCatalog, getCategories } from '@/lib/catalog';
import { getSettings, siteUrl } from '@/lib/settings';
import { themeVars } from '@/lib/theme';
import { defaultHomeDescription, defaultHomeTitle } from '@/lib/seo';
import { isLocale, locales } from '@/lib/i18n/config';
import '../fonts';
import '../globals.css';

// Re-read the catalogue from Supabase at most once a minute.
export const revalidate = 60;

export function generateStaticParams() {
  return locales.map(lang => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { seo } = await getSettings();
  const title = seo.homeTitle || defaultHomeTitle();
  const description = seo.homeDescription || defaultHomeDescription();
  return {
    metadataBase: new URL(siteUrl(seo)),
    title,
    description,
    applicationName: storeConfig.brand.name,
    // hidden from search until the owner switches it on in the admin (once the real domain is connected)
    robots: seo.indexable ? { index: true, follow: true, 'max-image-preview': 'large' } : { index: false, follow: false },
    verification: seo.googleVerification ? { google: seo.googleVerification } : undefined,
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, title: storeConfig.app.shortName, statusBarStyle: 'default' },
    icons: {
      icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
    },
    openGraph: { type: 'website', locale: 'en_US', siteName: storeConfig.brand.name, title, description, images: [seo.ogImage] },
    twitter: { card: 'summary_large_image', title, description, images: [seo.ogImage] },
  };
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: storeConfig.app.themeColor, viewportFit: 'cover' };

export default async function RootLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const [{ products }, categories, { theme }] = await Promise.all([getCatalog(), getCategories(), getSettings()]);
  return (
    <html lang="en" dir="ltr" style={themeVars(theme) as React.CSSProperties}>
      <body style={{ ['--rail-finish' as string]: RAIL_FINISHES[storeConfig.rail.finish] }}>
        <Providers products={products} categories={categories} lang={lang}>{children}</Providers>
      </body>
    </html>
  );
}
