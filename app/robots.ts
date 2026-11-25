import type { MetadataRoute } from 'next';
import { getSettings, siteUrl } from '@/lib/settings';

export const revalidate = 60;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { seo } = await getSettings();
  const base = siteUrl(seo);
  return {
    // Pages stay crawlable while hidden, so Google can read their "noindex" tag.
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/checkout', '/account'] },
    sitemap: seo.indexable ? `${base}/sitemap.xml` : undefined,
  };
}
