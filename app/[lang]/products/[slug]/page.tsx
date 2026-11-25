import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductPage from '@/components/ProductPage';
import JsonLd from '@/components/JsonLd';
import { getCatalog } from '@/lib/catalog';
import { getSettings, siteUrl } from '@/lib/settings';
import { isDemoProduct, productDescription, productPath, productSlug, productTitle } from '@/lib/seo';
import { storeConfig } from '@/store.config';

export const revalidate = 60;

export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.map(p => ({ slug: productSlug(p) }));
}

type Props = { params: Promise<{ slug: string }> };

async function find(params: Props['params']) {
  const slug = decodeURIComponent((await params).slug);
  const { products } = await getCatalog();
  return products.find(p => productSlug(p) === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [p, { seo }] = await Promise.all([find(params), getSettings()]);
  if (!p) return {};
  const title = productTitle(p), description = productDescription(p), path = productPath(p);
  const images = [{ url: p.frontImage, alt: p.nameEn || p.name }];
  return {
    title, description,
    alternates: { canonical: path },
    robots: !seo.indexable || isDemoProduct(p) ? { index: false, follow: true } : undefined,
    openGraph: { type: 'website', siteName: storeConfig.brand.name, title, description, url: path, images },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}

export default async function Page({ params }: Props) {
  const [p, { seo }] = await Promise.all([find(params), getSettings()]);
  if (!p) notFound();
  const base = siteUrl(seo);
  const abs = (u: string) => new URL(u, base).toString();
  const url = abs(productPath(p)), name = p.nameEn || p.name;
  const inStock = !p.variants || p.variants.some(v => v.stock > 0);
  const crumbs = [
    { name: storeConfig.brand.name, item: base },
    ...(p.categorySlug ? [{ name: p.category, item: abs(`/collections/${p.categorySlug}`) }] : []),
    { name, item: url },
  ];
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Product', name, description: productDescription(p), url,
            sku: productSlug(p), category: p.category || undefined,
            color: p.colors.join(', ') || undefined,
            image: [p.frontImage, p.backImage, p.sideImage].filter(Boolean).map(u => abs(u!)),
            brand: { '@type': 'Brand', name: storeConfig.brand.name },
            offers: {
              '@type': 'Offer', url, price: p.price.toFixed(2), priceCurrency: storeConfig.commerce.currency,
              availability: `https://schema.org/${inStock ? 'InStock' : 'OutOfStock'}`,
              itemCondition: 'https://schema.org/NewCondition',
            },
          },
          { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, ...c })) },
        ],
      }} />
      <ProductPage id={p.id} />
    </>
  );
}
