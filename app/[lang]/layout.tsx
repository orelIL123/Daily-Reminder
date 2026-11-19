import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import Providers from '@/components/Providers';
import { themeInitScript } from '@/lib/theme';
import { storeConfig, RAIL_FINISHES } from '@/store.config';
import { getCatalog } from '@/lib/catalog';
import { dictionaries } from '@/lib/i18n/dictionaries';
import { dirOf, isLocale, locales, localePath } from '@/lib/i18n/config';
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
    description: storeConfig.brand.tagline[lang],
    alternates: { languages: { he: localePath('he'), en: localePath('en') } },
    openGraph: { locale: lang === 'he' ? 'he_IL' : 'en_US' },
  };
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f6f2ec' };

export default async function RootLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { products } = await getCatalog();
  return (
    <html lang={lang} dir={dirOf(lang)} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body style={{ ['--rail-finish' as string]: RAIL_FINISHES[storeConfig.rail.finish] }}>
        <Providers products={products} lang={lang}>{children}</Providers>
      </body>
    </html>
  );
}
