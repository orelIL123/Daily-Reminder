import 'server-only';
import { initialProducts, type Product } from './products';
import { supabasePublic } from './supabase/public';

type Row = {
  id: string; slug: string; name_he: string; name_en: string; description_he: string; description_en: string;
  price: number; compare_at_price: number | null; sort_order: number;
  category: { slug: string; name_he: string; name_en: string } | null;
  images: { view: 'front' | 'side' | 'back' | 'detail'; url: string; sort_order: number }[];
  variants: { id: string; size: string; color: string; stock: number; price_override: number | null; sort_order: number; is_active: boolean }[];
};

/** Active catalogue from Supabase. Falls back to the bundled demo products if the database is unreachable. */
export async function getCatalog(): Promise<{ products: Product[]; source: 'supabase' | 'fallback' }> {
  const db = supabasePublic();
  if (!db) return { products: initialProducts, source: 'fallback' };

  const { data, error } = await db
    .from('products')
    .select(`id, slug, name_he, name_en, description_he, description_en, price, compare_at_price, sort_order,
             category:categories(slug, name_he, name_en),
             images:product_images(view, url, sort_order),
             variants:product_variants(id, size, color, stock, price_override, sort_order, is_active)`)
    .eq('status', 'active')
    .order('sort_order');

  if (error || !data) {
    console.error('[catalog] Supabase error, using fallback products:', error?.message);
    return { products: initialProducts, source: 'fallback' };
  }

  const products = (data as unknown as Row[]).map(r => {
    const img = (v: string) => r.images.find(i => i.view === v)?.url;
    const variants = r.variants.filter(v => v.is_active).sort((a, b) => a.sort_order - b.sort_order);
    const uniq = (xs: string[]) => Array.from(new Set(xs));
    return {
      id: r.id,
      slug: r.slug,
      name: r.name_he,
      nameEn: r.name_en,
      category: r.category?.name_en ?? '',
      price: Number(r.price),
      compareAtPrice: r.compare_at_price == null ? undefined : Number(r.compare_at_price),
      frontImage: img('front') ?? '',
      sideImage: img('side'),
      backImage: img('back'),
      description: r.description_he,
      descriptionEn: r.description_en,
      colors: uniq(variants.map(v => v.color)),
      sizes: uniq(variants.map(v => v.size)),
      variants: variants.map(v => ({ id: v.id, size: v.size, color: v.color, stock: v.stock })),
    } satisfies Product;
  }).filter(p => p.frontImage);

  return { products, source: 'supabase' };
}
