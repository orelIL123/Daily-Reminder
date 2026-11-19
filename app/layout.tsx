import type { Metadata, Viewport } from 'next';
import Providers from '@/components/Providers';
import { storeConfig, RAIL_FINISHES } from '@/store.config';
import { getCatalog } from '@/lib/catalog';
import './globals.css';

// Re-read the catalogue from Supabase at most once a minute.
export const revalidate = 60;

export const metadata: Metadata = {
  title: `${storeConfig.brand.name} — New Collection`,
  description: storeConfig.brand.tagline,
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f3eef8' };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { products } = await getCatalog();
  return (
    <html lang="en">
      <body style={{ ['--rail-finish' as string]: RAIL_FINISHES[storeConfig.rail.finish] }}><Providers products={products}>{children}</Providers></body>
    </html>
  );
}
