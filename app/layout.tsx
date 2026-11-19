import type { Metadata, Viewport } from 'next';
import Providers from '@/components/Providers';
import { themeInitScript } from '@/lib/theme';
import { storeConfig, RAIL_FINISHES } from '@/store.config';
import { getCatalog } from '@/lib/catalog';
import './globals.css';

// Re-read the catalogue from Supabase at most once a minute.
export const revalidate = 60;

export const metadata: Metadata = {
  title: `${storeConfig.brand.name} — New Collection`,
  description: storeConfig.brand.tagline,
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f6f2ec' };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { products } = await getCatalog();
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body style={{ ['--rail-finish' as string]: RAIL_FINISHES[storeConfig.rail.finish] }}><Providers products={products}>{children}</Providers></body>
    </html>
  );
}
