export type Variant = { id: string; size: string; color: string; stock: number };

export type Product = {
  id: string;
  slug?: string;
  nameEn?: string;
  descriptionEn?: string;
  categoryHe?: string;
  compareAtPrice?: number;
  /** Present when the catalogue comes from Supabase: real stock per size × color. */
  variants?: Variant[];
  name: string;
  category: string;
  price: number;
  frontImage: string;
  sideImage?: string;
  /** Optional back view. Shown when a shopper taps a garment to turn it. */
  backImage?: string;
  /** If set, the 3rd tap on the rail adds the piece to the bag with this size and opens the bag. */
  quickSize?: string;
  description: string;
  colors: string[];
  sizes: string[];
};

export const initialProducts: Product[] = [
  { id: 'aba-01', name: 'ישתבח — חולצת ציצית', nameEn: 'Yishtabach — Tzitzit Tee', category: 'Tzitzit Tee', categoryHe: 'חולצות ציצית', price: 249, frontImage: '/products/tee-front.webp', sideImage: '/products/tee-side.webp', backImage: '/products/tee-back.webp', quickSize: 'L', description: 'חולצת ציצית אוברסייז מכותנה כבדה, עם ציציות חבוקות בצדדים והדפס "ישתבח שמו לעד".', descriptionEn: 'Oversized heavyweight cotton tee with side tassels and the "Yishtabach Shemo La\'ad" print.', colors: ['White'], sizes: ['S','M','L','XL','XXL'] },
  { id: '01', name: 'Essential Zip Jacket', category: 'Outerwear', price: 449, frontImage: '/products/gen/essential-zip-jacket-front.webp', sideImage: '/products/gen/essential-zip-jacket-side.webp', backImage: '/products/gen/essential-zip-jacket-back.webp', description: 'Everyday layering, reimagined. A relaxed silhouette with minimal hardware.', colors: ['Charcoal', 'Black'], sizes: ['S','M','L','XL'] },
  { id: '02', name: 'Nightfall Hoodie', category: 'Essentials', price: 379, frontImage: '/products/gen/nightfall-hoodie-front.webp', sideImage: '/products/gen/nightfall-hoodie-side.webp', backImage: '/products/gen/nightfall-hoodie-back.webp', description: 'A heavyweight cotton-blend hoodie designed to be worn on repeat.', colors: ['Navy', 'Cream'], sizes: ['S','M','L','XL'] },
  { id: '03', name: 'Studio Crew', category: 'Sweatshirts', price: 329, frontImage: '/products/gen/studio-crew-front.webp', sideImage: '/products/gen/studio-crew-side.webp', backImage: '/products/gen/studio-crew-back.webp', description: 'The understated everyday crewneck, with a contemporary drop shoulder.', colors: ['Stone', 'Ash'], sizes: ['XS','S','M','L','XL'] },
  { id: '04', name: 'Alpine Fleece', category: 'Outerwear', price: 499, frontImage: '/products/gen/alpine-fleece-front.webp', sideImage: '/products/gen/alpine-fleece-side.webp', backImage: '/products/gen/alpine-fleece-back.webp', description: 'Soft brushed fleece with an easy, relaxed fit.', colors: ['Ecru', 'Black'], sizes: ['S','M','L'] },
  { id: '05', name: 'Forest Hoodie', category: 'Essentials', price: 399, frontImage: '/products/gen/forest-hoodie-front.webp', sideImage: '/products/gen/forest-hoodie-side.webp', backImage: '/products/gen/forest-hoodie-back.webp', description: 'Our signature hoodie in deep forest green.', colors: ['Forest', 'Black'], sizes: ['S','M','L','XL'] },
  { id: '06', name: 'Blackout Overshirt', category: 'Outerwear', price: 469, frontImage: '/products/gen/blackout-overshirt-front.webp', sideImage: '/products/gen/blackout-overshirt-side.webp', backImage: '/products/gen/blackout-overshirt-back.webp', description: 'A clean, elevated layer for in-between seasons.', colors: ['Black'], sizes: ['S','M','L','XL'] },
  { id: '07', name: 'Everyday Tee', category: 'T-Shirts', price: 169, frontImage: '/products/gen/everyday-tee-front.webp', sideImage: '/products/gen/everyday-tee-side.webp', backImage: '/products/gen/everyday-tee-back.webp', description: 'An exceptionally comfortable tee cut from soft heavyweight jersey.', colors: ['White', 'Black'], sizes: ['XS','S','M','L','XL'] },
  { id: '08', name: 'Stonewash Crew', category: 'Sweatshirts', price: 349, frontImage: '/products/gen/stonewash-crew-front.webp', sideImage: '/products/gen/stonewash-crew-side.webp', backImage: '/products/gen/stonewash-crew-back.webp', description: 'A washed cotton pullover with a lived-in hand feel.', colors: ['Stone', 'Slate'], sizes: ['S','M','L','XL'] },
  { id: '09', name: 'Coastal Hoodie', category: 'Essentials', price: 389, frontImage: '/products/gen/coastal-hoodie-front.webp', sideImage: '/products/gen/coastal-hoodie-side.webp', backImage: '/products/gen/coastal-hoodie-back.webp', description: 'A warm, clean everyday staple.', colors: ['Cream', 'Navy'], sizes: ['S','M','L','XL'] }
];
export const STORAGE_KEY = 'dr-rail-products-v4';
export function loadProducts(): Product[] {
  if (typeof window === 'undefined') return initialProducts;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialProducts;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length && parsed.every(p => p && typeof p.id === 'string' && typeof p.frontImage === 'string')) return parsed as Product[];
    return initialProducts;
  } catch { return initialProducts; }
}
export function saveProducts(products: Product[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event('rail-products-updated'));
}
