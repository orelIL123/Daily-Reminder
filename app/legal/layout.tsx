import '@fontsource-variable/bodoni-moda/opsz.css';
import '@fontsource-variable/bodoni-moda/opsz-italic.css';
import '@fontsource-variable/jost';
import '@fontsource-variable/heebo';
import '../globals.css';

export const metadata = { title: 'Daily Reminder — מידע ותקנון' };

/* Legal pages (terms, returns, shipping, privacy, accessibility) are in Hebrew, right-to-left. */
export default function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl">
      <body className="legal-body">{children}</body>
    </html>
  );
}
