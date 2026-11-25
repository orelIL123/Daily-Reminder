import type { MetadataRoute } from 'next';
import { getSettings, siteUrl } from '@/lib/settings';
import { getCatalog, getCategories } from '@/lib/catalog';
import { isDemoProduct, productPath } from '@/lib/seo';
import { LEGAL } from '@/lib/legal';

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ seo }, { products }, categories] = await Promise.all([getSettings(), getCatalog(), getCategories()]);
  const base = siteUrl(seo);
  const abs = (u: string) => new URL(u, base).toString();
  const real = products.filter(p => !isDemoProduct(p));
  return [
    { url: abs('/'), changeFrequency: 'daily', priority: 1 },
    ...categories.filter(c => real.some(p => p.categorySlug === c.slug))
      .map(c => ({ url: abs(`/collections/${c.slug}`), changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...real.map(p => ({
      url: abs(productPath(p)), lastModified: p.updatedAt, changeFrequency: 'weekly' as const, priority: 0.8,
      images: [p.frontImage, p.backImage].filter(Boolean).map(u => abs(u!)),
    })),
    ...Object.entries(LEGAL).filter(([, d]) => !d.draft)
      .map(([k]) => ({ url: abs(`/legal/${k}`), changeFrequency: 'yearly' as const, priority: 0.2 })),
  ];
}
