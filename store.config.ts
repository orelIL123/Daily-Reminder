/**
 * ─────────────────────────────────────────────────────────────
 *  STORE CONFIG — everything that makes this store "this store".
 *  A new store = a new copy of this file + products + images.
 *  Code reads only from here; nothing brand-specific lives in components.
 * ─────────────────────────────────────────────────────────────
 */

export type RailFinish = 'steel' | 'silver' | 'gold' | 'black' | 'brass' | 'white';
export type GarmentView = 'front' | 'side' | 'back';
/** Store copy. The storefront is English only; kept as an object so a language can be added later. */
export type L = { en: string };

export const storeConfig = {
  brand: {
    name: 'Daily Reminder',
    accentDot: true, // the small coloured "." after the name
    tagline: { en: 'Premium streetwear. Explore the collection on the rail.' } as L,
    footerNote: { en: 'Considered essentials, made to move with you. Designed in Tel Aviv.' } as L,
  },

  /** Shown in the footer, the contact page and the PWA. */
  contact: {
    email: 'Nissankadosh1998@gmail.com',
    phone: '058-566-4040',
    phoneIntl: '+972585664040',
    whatsapp: 'https://wa.me/972585664040',
  },

  hero: {
    /** Background behind the rail: null = soft white studio (white with a gentle floor shadow). */
    background: null as { desktop: string; mobile: string } | null,
  },

  /** Section 2 — "The Straight Rail" showcase. */
  showcase: {
    /** Product shown front-facing (with the "Featured" badge) when the section loads. null = the middle piece. */
    featuredId: null as string | null,
    /** null = soft white studio. Add an image path to use a photo. */
    background: null as string | null,
  },

  /**
   * Editorial "behind the collection" gallery under the straight rail.
   * Each tile shows a crop of a photo (focus = CSS object-position).
   */
  editorial: {
    eyebrow: 'Collection 02',
    title: 'The Layered Tee',
    text: 'Garment-dyed heavyweight cotton, a raw-edge double sleeve and a tonal embroidered flame. Designed, developed and produced in small runs — from the first sketch to the bag it leaves in.',
    steps: ['Design', 'Development', 'Production'],
    tiles: [
      { src: '/editorial/studio.jpg', alt: 'The Collection 02 mood board in the studio', focus: '50% 40%', size: 'tall' },
      { src: '/editorial/bag.jpg', alt: 'A layered tee folded in a Daily Reminder shopping bag', focus: '50% 45%', size: 'tall' },
      { src: '/editorial/detail-flame.jpg', alt: 'Embroidered flame on garment-dyed cotton', focus: '50% 50%', size: 'square' },
      { src: '/editorial/detail-collar.jpg', alt: 'Woven neck label on a ribbed collar', focus: '50% 50%', size: 'square' },
      { src: '/editorial/detail-seam.jpg', alt: 'Stitching detail on the hem', focus: '50% 50%', size: 'square' },
    ],
  },

  rail: {
    /** Which rails the home page shows: the curved 3D rail, the straight rail, or both. */
    layout: 'both' as 'curved' | 'straight' | 'both',
    finish: 'steel' as RailFinish,
    /** How pieces hang when nobody is touching them. */
    curvedRestView: 'front' as GarmentView,
    straightRestView: 'side' as GarmentView,
    /** What the straight rail shows on hover / first tap. */
    straightHoverView: 'front' as GarmentView,
    showPriceTags: true,
  },

  commerce: {
    currency: 'ILS',
    locale: 'en-IL',
    freeShippingFrom: 350,
    shippingPrice: 35,
    perks: [{ en: 'Free shipping over ₪350' }, { en: '14-day returns' }] as L[],
  },

  /** Home-screen app (PWA). */
  app: {
    shortName: 'Daily Reminder',
    themeColor: '#ffffff',
  },
};

/** CSS gradients for each rail finish (used by both rails). */
export const RAIL_FINISHES: Record<RailFinish, string> = {
  // smooth satin grey — soft, even highlights (no hard bands)
  steel: 'linear-gradient(180deg, #f4f5f7 0%, #d9dbe0 24%, #b3b6bd 56%, #c8cacf 80%, #a2a5ac 100%)',
  silver: 'linear-gradient(180deg, #ffffff 0%, #dcdde2 30%, #a3a6ad 62%, #c9cbd0 82%, #8b8e95 100%)',
  gold: 'linear-gradient(180deg, #fff6d8 0%, #e8cf8a 30%, #b8913f 62%, #d9b766 82%, #8f6c2a 100%)',
  brass: 'linear-gradient(180deg, #f7e7c8 0%, #cfae78 30%, #9b7a45 62%, #b9955d 82%, #6f5430 100%)',
  black: 'linear-gradient(180deg, #6b6d72 0%, #3a3b3f 30%, #17181a 62%, #2b2c30 82%, #0c0c0d 100%)',
  white: 'linear-gradient(180deg, #ffffff 0%, #f6f6f6 30%, #dedede 62%, #ececec 82%, #c9c9c9 100%)',
};

/** Colour of each of `n` horizontal bands of a rail finish (sampled from its gradient), so the 3D rail can be drawn as one smooth shape. */
export function railBands(finish: RailFinish, n: number): string[] {
  const g = RAIL_FINISHES[finish];
  const stops = [...g.matchAll(/(#[0-9a-f]{6})\s+(\d+)%/gi)].map(m => ({ c: m[1], p: Number(m[2]) / 100 }));
  const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const out: string[] = [];
  for (let k = 0; k < n; k++) {
    const f = (k + 0.5) / n;
    let i = 0;
    while (i < stops.length - 2 && f > stops[i + 1].p) i++;
    const a = stops[i], b = stops[i + 1];
    const u = Math.min(1, Math.max(0, (f - a.p) / (b.p - a.p)));
    const ca = rgb(a.c), cb = rgb(b.c);
    out.push(`rgb(${ca.map((v, j) => Math.round(v + (cb[j] - v) * u)).join(',')})`);
  }
  return out;
}
