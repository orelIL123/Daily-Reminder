/**
 * ─────────────────────────────────────────────────────────────
 *  STORE CONFIG — everything that makes this store "this store".
 *  A new store = a new copy of this file + products + images.
 *  Code reads only from here; nothing brand-specific lives in components.
 * ─────────────────────────────────────────────────────────────
 */

export type RailFinish = 'silver' | 'gold' | 'black' | 'brass' | 'white';
export type GarmentView = 'front' | 'side' | 'back';
/** Store copy in both site languages. Hebrew is the main language. */
export type L = { he: string; en: string };

export const storeConfig = {
  brand: {
    name: 'Daily Reminder',
    accentDot: true, // the small coloured "." after the name
    tagline: { he: 'סטריטוור פרימיום. גלו את הקולקציה על המתלה.', en: 'Premium streetwear. Explore the collection on the rail.' } as L,
    footerNote: { he: 'בגדי יסוד שנבחרו בקפידה, ונעים איתך לאורך היום. מעוצב בתל אביב.', en: 'Considered essentials, made to move with you. Designed in Tel Aviv.' } as L,
  },

  hero: {
    eyebrow: [{ he: 'קולקציה חדשה', en: 'New collection' }, { he: 'סטריטוור פרימיום', en: 'Premium streetwear' }] as L[],
    sideCopy: [{ he: 'כותנה כבדה ואיכותית.', en: 'Crafted in heavyweight fleece.' }, { he: 'גזרה אוברסייז. נבנה להחזיק.', en: 'Cut oversized. Made to last.' }] as L[],
    /** Background behind the rail. Image paths in /public, or null for the soft gradient. */
    background: { desktop: '/hero-bg.webp', mobile: '/hero-bg-mobile.webp' } as { desktop: string; mobile: string } | null,
    /** Dark-mode background behind the rail (falls back to a dark gradient if the file is missing). */
    backgroundDark: { desktop: '/dr-dark-bg.webp', mobile: '/dr-dark-bg-mobile.webp' } as { desktop: string; mobile: string } | null,
  },

  /** Section 2 — "The Straight Rail" showcase. */
  showcase: {
    eyebrow: [{ he: 'קולקציה חדשה', en: 'New collection' }, { he: 'סטריטוור פרימיום', en: 'Premium streetwear' }] as L[],
    /** Rendered as: title[0] <em>title[1]</em> title[2] */
    title: { he: ['', 'המתלה', 'הישר'], en: ['The', 'Straight', 'Rail'] },
    subtitle: { he: 'גלריה זורמת לבגדי היום־יום.', en: 'A fluid gallery for everyday essentials.' } as L,
    steps: [{ he: 'גלו', en: 'Explore' }, { he: 'רחפו', en: 'Hover' }, { he: 'בחרו', en: 'Select' }, { he: 'קנו', en: 'Shop' }] as L[],
    /** Product shown front-facing (with the "Featured" badge) when the section loads. null = the middle piece. */
    featuredId: null as string | null,
    /** light: null = plain base colour. Add an image path here to use a photo in light mode. */
    background: { light: null, dark: '/dr-dark-bg.webp' } as { light: string | null; dark: string } | null,
    categories: [
      { label: { he: 'טישרטים', en: 'T-Shirts' }, note: { he: 'חולצות יום־יום ברמה אחרת', en: 'Premium everyday tees' }, icon: 'tee', href: '#collection' },
      { label: { he: 'קפוצ׳ונים', en: 'Hoodies' }, note: { he: 'נוחות ברמה גבוהה', en: 'Elevated comfort' }, icon: 'hoodie', href: '#collection' },
      { label: { he: 'ז׳קטים', en: 'Jackets' }, note: { he: 'שכבה עליונה לכל מצב', en: 'Versatile outerwear' }, icon: 'jacket', href: '#collection' },
      { label: { he: 'אקססוריז', en: 'Accessories' }, note: { he: 'משלימים את הלוק', en: 'Complete the look' }, icon: 'cap', href: '#collection' },
    ],
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
    /** Number formatting per site language. */
    locales: { he: 'he-IL', en: 'en-IL' },
    freeShippingFrom: 350,
    shippingPrice: 35,
    perks: [{ he: 'משלוח חינם מעל ₪350', en: 'Free shipping over ₪350' }, { he: 'החזרה תוך 14 יום', en: '14-day returns' }] as L[],
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
