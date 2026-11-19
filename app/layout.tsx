import type { Metadata, Viewport } from 'next';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Daily Reminder — New Collection',
  description: 'Premium streetwear. Explore the collection on the rail.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f3eef8' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
