import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import Providers from '@/components/Providers';
import { storeConfig, RAIL_FINISHES } from '@/store.config';
import { getCatalog, getCategories } from '@/lib/catalog';
import { dictionaries } from '@/lib/i18n/dictionaries';
import { isLocale, locales } from '@/lib/i18n/config';
import '@fontsource-variable/bodoni-moda/opsz.css';
import '@fontsource-variable/bodoni-moda/opsz-italic.css';
import '@fontsource-variable/jost';
import '../globals.css';

// Re-read the catalogue from Supabase at most once a minute.
export const revalidate = 60;

export function generateStaticParams() {
  return locales.map(lang => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: `${storeConfig.brand.name} — ${dictionaries[lang].meta.titleSuffix}`,
    description: storeConfig.brand.tagline.en,
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, title: storeConfig.app.shortName, statusBarStyle: 'default' },
    icons: {
      icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
    },
    openGraph: { locale: 'en_US', siteName: storeConfig.brand.name },
  };
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: storeConfig.app.themeColor, viewportFit: 'cover' };

export default async function RootLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const [{ products }, categories] = await Promise.all([getCatalog(), getCategories()]);
  return (
    <html lang="en" dir="ltr">
      <body style={{ ['--rail-finish' as string]: RAIL_FINISHES[storeConfig.rail.finish] }}>
        <Providers products={products} categories={categories} lang={lang}>{children}</Providers>
      </body>
    </html>
  );
}
