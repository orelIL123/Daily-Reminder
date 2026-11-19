import type { Metadata, Viewport } from 'next';
import Providers from '@/components/Providers';
import { storeConfig, RAIL_FINISHES } from '@/store.config';
import './globals.css';

export const metadata: Metadata = {
  title: `${storeConfig.brand.name} — New Collection`,
  description: storeConfig.brand.tagline,
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f3eef8' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body style={{ ['--rail-finish' as string]: RAIL_FINISHES[storeConfig.rail.finish] }}><Providers>{children}</Providers></body>
    </html>
  );
}
