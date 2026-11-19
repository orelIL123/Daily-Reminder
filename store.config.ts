/**
 * ─────────────────────────────────────────────────────────────
 *  STORE CONFIG — everything that makes this store "this store".
 *  A new store = a new copy of this file + products + images.
 *  Code reads only from here; nothing brand-specific lives in components.
 * ─────────────────────────────────────────────────────────────
 */

export type RailFinish = 'silver' | 'gold' | 'black' | 'brass' | 'white';
export type GarmentView = 'front' | 'side' | 'back';

export const storeConfig = {
  brand: {
    name: 'Daily Reminder',
    accentDot: true, // the small coloured "." after the name
    tagline: 'Premium streetwear. Explore the collection on the rail.',
    footerNote: 'Considered essentials, made to move with you. Designed in Tel Aviv.',
  },

  hero: {
    eyebrow: ['New collection', 'Premium streetwear'],
    sideCopy: ['Crafted in heavyweight fleece.', 'Cut oversized. Made to last.'],
    /** Background behind the rail. Image paths in /public, or null for the soft gradient. */
    background: { desktop: '/hero-bg.webp', mobile: '/hero-bg-mobile.webp' } as { desktop: string; mobile: string } | null,
  },

  rail: {
    /** Which rails the home page shows: the curved 3D rail, the straight rail, or both. */
    layout: 'both' as 'curved' | 'straight' | 'both',
    finish: 'silver' as RailFinish,
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
    perks: ['Free shipping over ₪350', '14-day returns'],
  },
};

/** CSS gradients for each rail finish (used by both rails). */
export const RAIL_FINISHES: Record<RailFinish, string> = {
  silver: 'linear-gradient(180deg, #ffffff 0%, #dcdde2 30%, #a3a6ad 62%, #c9cbd0 82%, #8b8e95 100%)',
  gold: 'linear-gradient(180deg, #fff6d8 0%, #e8cf8a 30%, #b8913f 62%, #d9b766 82%, #8f6c2a 100%)',
  brass: 'linear-gradient(180deg, #f7e7c8 0%, #cfae78 30%, #9b7a45 62%, #b9955d 82%, #6f5430 100%)',
  black: 'linear-gradient(180deg, #6b6d72 0%, #3a3b3f 30%, #17181a 62%, #2b2c30 82%, #0c0c0d 100%)',
  white: 'linear-gradient(180deg, #ffffff 0%, #f6f6f6 30%, #dedede 62%, #ececec 82%, #c9c9c9 100%)',
};
