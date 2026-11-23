import type { Metadata } from 'next';
import '@fontsource-variable/bodoni-moda/opsz.css';
import '@fontsource-variable/bodoni-moda/opsz-italic.css';
import '@fontsource-variable/jost';
import '@fontsource-variable/heebo';
import '../globals.css';

export const metadata: Metadata = {
  title: 'ניהול החנות',
  robots: { index: false, follow: false },
  // the admin can be added to the home screen too — so order alerts reach the phone (iPhone needs this)
  manifest: '/admin.webmanifest',
  appleWebApp: { capable: true, title: 'DR ניהול', statusBarStyle: 'default' },
  icons: { apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }] },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
