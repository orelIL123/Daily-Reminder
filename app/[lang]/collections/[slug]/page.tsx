import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CollectionPage from '@/components/CollectionPage';
import { getCatalog, getCategories } from '@/lib/catalog';
import { getSettings } from '@/lib/settings';
import { clip, isDemoProduct } from '@/lib/seo';
import { storeConfig } from '@/store.config';

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getCategories()).map(c => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [categories, { products }, { seo }] = await Promise.all([getCategories(), getCatalog(), getSettings()]);
  const c = categories.find(x => x.slug === slug);
  if (!c) return {};
  const items = products.filter(p => p.categorySlug === slug);
  const title = `${c.name} — ${storeConfig.brand.name}`;
  const description = clip(`Shop ${c.name} by ${storeConfig.brand.name}. ${items.slice(0, 4).map(p => p.nameEn || p.name).join(', ')}`);
  return {
    title, description,
    alternates: { canonical: `/collections/${slug}` },
    // an empty (or demo-only) category is thin content — leave it out of search
    robots: !seo.indexable || !items.some(p => !isDemoProduct(p)) ? { index: false, follow: true } : undefined,
    openGraph: { type: 'website', siteName: storeConfig.brand.name, title, description, images: [items[0]?.frontImage ?? seo.ogImage] },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!(await getCategories()).some(c => c.slug === slug)) notFound();
  return <CollectionPage slug={slug} />;
}
