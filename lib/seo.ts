/*
 * SEO settings (admin → SEO וגוגל) and the helpers pages use to build search metadata.
 * Safe to import from both server and browser code.
 */
import { storeConfig } from '@/store.config';
import type { Product } from './products';

export type SeoSettings = {
  /** The real domain, e.g. https://www.brand.co.il. Empty until a domain is connected. */
  siteUrl: string;
  /** Off = every page asks search engines not to list it. */
  indexable: boolean;
  googleVerification: string;
  homeTitle: string;
  homeDescription: string;
  ogImage: string;
  instagram: string;
  tiktok: string;
};

export const DEFAULT_SEO: SeoSettings = {
  siteUrl: '', indexable: false, googleVerification: '', homeTitle: '', homeDescription: '',
  ogImage: '/editorial/studio.jpg', instagram: '', tiktok: '',
};

export function readSeo(v: unknown): SeoSettings {
  const s = (v ?? {}) as Record<string, unknown>;
  const str = (k: keyof SeoSettings) => (typeof s[k] === 'string' ? (s[k] as string).trim() : (DEFAULT_SEO[k] as string));
  return {
    siteUrl: normalizeSiteUrl(str('siteUrl')),
    indexable: s.indexable === true,
    googleVerification: parseVerification(str('googleVerification')),
    homeTitle: str('homeTitle'), homeDescription: str('homeDescription'),
    ogImage: str('ogImage') || DEFAULT_SEO.ogImage,
    instagram: str('instagram'), tiktok: str('tiktok'),
  };
}

/** "brand.co.il/anything" → "https://brand.co.il"; anything unusable → "". */
export function normalizeSiteUrl(v: string): string {
  const t = v.trim();
  if (!t) return '';
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    return u.hostname.includes('.') ? u.origin : '';
  } catch { return ''; }
}

/** The owner may paste Google's whole <meta> tag, or only the code inside it. */
export function parseVerification(v: string): string {
  const m = v.match(/content\s*=\s*["']([^"']+)["']/i);
  const code = (m ? m[1] : v).trim();
  return /^[A-Za-z0-9_\-=]{10,120}$/.test(code) ? code : '';
}

/** Shortens a description to what search results show, without cutting a word. */
export function clip(text: string, max = 160) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 60 ? cut.lastIndexOf(' ') : cut.length).replace(/[,.;:\s]+$/, '')}…`;
}

export const defaultHomeTitle = () => `${storeConfig.brand.name} — New Collection`;
export const defaultHomeDescription = () => storeConfig.brand.tagline.en;

export const productSlug = (p: Pick<Product, 'slug' | 'id'>) => p.slug || p.id;
export const productPath = (p: Pick<Product, 'slug' | 'id'>) => `/products/${productSlug(p)}`;
/** Placeholder pieces from the starter data — kept out of Google. */
export const isDemoProduct = (p: Pick<Product, 'slug'>) => !!p.slug?.startsWith('demo-');

export function productTitle(p: Product) {
  return p.seoTitle || `${p.nameEn || p.name} — ${storeConfig.brand.name}`;
}
export function productDescription(p: Product) {
  const name = p.nameEn || p.name;
  return clip(p.seoDescription || p.descriptionEn || `${name} by ${storeConfig.brand.name}.`);
}
