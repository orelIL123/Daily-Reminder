import type { Metadata } from 'next';
import { getSettings, siteUrl } from '@/lib/settings';
import { themeVars } from '@/lib/theme';
import Tracker from '@/components/Tracker';
import '../fonts';
import '../globals.css';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getSettings();
  return {
    metadataBase: new URL(siteUrl(seo)),
    title: 'Daily Reminder — מידע ותקנון',
    robots: seo.indexable ? undefined : { index: false, follow: false },
  };
}

/* Legal pages (terms, returns, shipping, privacy, accessibility) are in Hebrew, right-to-left. */
export default async function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { theme } = await getSettings();
  return (
    <html lang="he" dir="rtl" style={themeVars(theme) as React.CSSProperties}>
      <body className="legal-body">{children}<Tracker /></body>
    </html>
  );
}
