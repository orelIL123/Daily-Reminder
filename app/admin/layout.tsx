import '../globals.css';

export const metadata = { title: 'Admin', robots: { index: false } };

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
