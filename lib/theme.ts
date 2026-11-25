/*
 * Fonts the owner can choose in the admin → עיצוב. The choice is saved in store_settings ("theme")
 * and applied to the storefront as two CSS variables.
 */
type Font = { name: string; stack: string; italic: boolean; note: string };

const serif = (n: string) => `'${n}', Georgia, 'Times New Roman', serif`;
const sans = (n: string) => `'${n}', system-ui, -apple-system, sans-serif`;

/** Headings, product names and the logo. */
export const DISPLAY_FONTS = {
  'bodoni-moda': { name: 'Bodoni Moda', stack: serif('Bodoni Moda Variable'), italic: true, note: 'מגזין אופנה קלאסי' },
  'cormorant': { name: 'Cormorant Garamond', stack: serif('Cormorant Garamond Variable'), italic: true, note: 'עדין ויוקרתי' },
  'playfair': { name: 'Playfair Display', stack: serif('Playfair Display Variable'), italic: true, note: 'אלגנטי ונוכח' },
  'instrument-serif': { name: 'Instrument Serif', stack: serif('Instrument Serif'), italic: true, note: 'אטלייה עכשווי' },
  'fraunces': { name: 'Fraunces', stack: serif('Fraunces Variable'), italic: true, note: 'חם ורך' },
  'dm-serif': { name: 'DM Serif Display', stack: serif('DM Serif Display'), italic: true, note: 'כותרות חזקות' },
  'bebas': { name: 'Bebas Neue', stack: sans('Bebas Neue'), italic: false, note: 'סטריט, אותיות גדולות' },
  'syne': { name: 'Syne', stack: sans('Syne Variable'), italic: false, note: 'אורבני ונועז' },
  'archivo': { name: 'Archivo', stack: sans('Archivo Variable'), italic: true, note: 'ספורטיבי ונקי' },
  'outfit': { name: 'Outfit', stack: sans('Outfit Variable'), italic: false, note: 'מינימלי ועגול' },
  'manrope': { name: 'Manrope', stack: sans('Manrope Variable'), italic: false, note: 'מודרני ומדויק' },
} satisfies Record<string, Font>;

/** Everything else: menus, prices, buttons, text. */
export const BODY_FONTS = {
  'jost': { name: 'Jost', stack: sans('Jost Variable'), italic: true, note: 'גאומטרי ונקי' },
  'montserrat': { name: 'Montserrat', stack: sans('Montserrat Variable'), italic: true, note: 'רחב וברור' },
  'inter': { name: 'Inter', stack: sans('Inter Variable'), italic: true, note: 'קריא במיוחד' },
  'instrument-sans': { name: 'Instrument Sans', stack: sans('Instrument Sans Variable'), italic: true, note: 'צר ואופנתי' },
  'dm-sans': { name: 'DM Sans', stack: sans('DM Sans Variable'), italic: true, note: 'ידידותי' },
  'manrope': { name: 'Manrope', stack: sans('Manrope Variable'), italic: false, note: 'מודרני ומדויק' },
} satisfies Record<string, Font>;

export type DisplayFontId = keyof typeof DISPLAY_FONTS;
export type BodyFontId = keyof typeof BODY_FONTS;
export type Theme = { display: DisplayFontId; body: BodyFontId };

/** Ready-made combinations that sit well together. */
export const FONT_PAIRS: { id: string; name: string; display: DisplayFontId; body: BodyFontId }[] = [
  { id: 'editorial', name: 'Editorial', display: 'bodoni-moda', body: 'jost' },
  { id: 'couture', name: 'Couture', display: 'cormorant', body: 'montserrat' },
  { id: 'magazine', name: 'Magazine', display: 'playfair', body: 'inter' },
  { id: 'atelier', name: 'Atelier', display: 'instrument-serif', body: 'instrument-sans' },
  { id: 'warm', name: 'Warm', display: 'fraunces', body: 'dm-sans' },
  { id: 'gallery', name: 'Gallery', display: 'dm-serif', body: 'dm-sans' },
  { id: 'street', name: 'Street', display: 'bebas', body: 'dm-sans' },
  { id: 'urban', name: 'Urban', display: 'syne', body: 'inter' },
  { id: 'sport', name: 'Sport', display: 'archivo', body: 'inter' },
  { id: 'minimal', name: 'Minimal', display: 'outfit', body: 'inter' },
];

export const DEFAULT_THEME: Theme = { display: 'bodoni-moda', body: 'jost' };

/** Accepts whatever is stored and always returns a valid theme. */
export function readTheme(v: unknown): Theme {
  const t = (v ?? {}) as Partial<Record<keyof Theme, string>>;
  return {
    display: t.display && Object.hasOwn(DISPLAY_FONTS, t.display) ? (t.display as DisplayFontId) : DEFAULT_THEME.display,
    body: t.body && Object.hasOwn(BODY_FONTS, t.body) ? (t.body as BodyFontId) : DEFAULT_THEME.body,
  };
}

/** CSS variables for a theme — set on <html> (or on a preview box). */
export function themeVars(theme: Theme): Record<string, string> {
  const d = DISPLAY_FONTS[theme.display];
  return {
    '--font-display': d.stack,
    '--font-body': BODY_FONTS[theme.body].stack,
    // fonts with no true italic stay upright instead of being slanted by the browser
    '--display-italic': d.italic ? 'italic' : 'normal',
  };
}
