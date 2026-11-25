import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LEGAL } from '@/lib/legal';
import { storeConfig } from '@/store.config';

export function generateStaticParams() {
  return Object.keys(LEGAL).map(page => ({ page }));
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  return { title: `${LEGAL[page]?.title ?? ''} — ${storeConfig.brand.name}`, alternates: { canonical: `/legal/${page}` } };
}

export default async function LegalPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const doc = LEGAL[page];
  if (!doc) notFound();
  return (
    <div className="legal">
      <header className="legal-head">
        <Link href="/" className="brand" dir="ltr">{storeConfig.brand.name}<span>.</span></Link>
        <Link href="/" className="legal-back" dir="ltr">Back to the store →</Link>
      </header>
      <article>
        <h1>{doc.title}</h1>
        <p className="legal-updated">עודכן: {doc.updated}</p>
        {doc.draft && <p className="legal-draft">הנוסח המלא של עמוד זה בהכנה ויעודכן בקרוב.</p>}
        {doc.sections.map((s, i) => (
          <section key={i}>
            {s.h && <h2>{s.h}</h2>}
            {s.p.map((p, j) => <p key={j}>{p}</p>)}
          </section>
        ))}
      </article>
      <nav className="legal-nav">
        {Object.entries(LEGAL).map(([k, d]) => <Link key={k} href={`/legal/${k}`} aria-current={k === page ? 'page' : undefined}>{d.title}</Link>)}
      </nav>
    </div>
  );
}
