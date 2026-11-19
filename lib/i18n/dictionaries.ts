import type { Locale } from './config';

/*
 * Interface text for every store built from this kit.
 * Store-specific copy (slogans, categories, perks) lives in store.config.ts.
 */

const en = {
  meta: { titleSuffix: 'New Collection' },
  nav: { newIn: 'New in', shopAll: 'Shop all', about: 'About', home: 'Home', main: 'Main', search: 'Search', account: 'Account', bag: (n: number) => `Bag, ${n} item${n === 1 ? '' : 's'}`, switchTo: 'עברית', switchToLabel: 'לאתר בעברית' },
  theme: { toLight: 'Switch to light mode', toDark: 'Switch to dark mode', light: 'Light mode', dark: 'Dark mode' },
  rail: {
    region: 'Clothing rail — drag or use arrow keys',
    prev: 'Previous piece', next: 'Next piece', choose: 'Choose a piece',
    hintStart: 'Drag the rail · tap a piece to turn it',
    hintBack: 'Tap again to see the back',
    hintOpen: 'Tap again to choose a size',
    bringFront: (name: string) => `Bring ${name} to the front`,
    tapContinue: (name: string) => `${name} — tap to continue`,
    flatHintFine: 'Hover a piece to see the front · click to open',
    flatHintTouch: 'Tap a piece to see the front · tap again to open',
    featured: 'Featured',
    piecesOnRail: 'Pieces on the rail',
  },
  showcase: { hintFine: 'Hover or drag the rail to explore', hintTouch: 'Swipe the rail · tap to open', categories: 'Shop by category' },
  cta: { shopPiece: 'Shop this piece', shopCollection: 'Shop the collection' },
  collection: { title: 'The collection', pieces: (n: number) => `${n} pieces`, colors: (n: number) => `${n} color${n === 1 ? '' : 's'}` },
  footer: { shipping: 'Shipping', returns: 'Returns', terms: 'Terms', accessibility: 'Accessibility', contact: 'Contact' },
  product: {
    close: 'Close', view: 'View', front: 'Front', back: 'Back', frontAlt: (n: string) => `${n} — front`, backAlt: (n: string) => `${n} — back`,
    color: 'Color', size: 'Size', soldOutSize: (s: string) => `${s} — sold out`,
    selectSize: 'Select a size', addToBag: (price: string) => `Add to bag — ${price}`, added: 'Added',
    onlyLeft: (n: number, s: string) => `Only ${n} left in ${s}`, soldOut: 'Sold out',
  },
  cart: {
    title: (n: number) => `Your bag (${n})`, label: 'Shopping bag', close: 'Close bag', empty: 'Your bag is empty.', keepExploring: 'Keep exploring',
    size: 'Size', sizeOption: (s: string) => `Size ${s}`, less: 'Less', more: 'More', remove: 'Remove',
    subtotal: 'Subtotal', shippingNote: 'Shipping calculated at checkout.', checkout: 'Checkout',
  },
  checkout: {
    secure: 'Secure checkout', continue: 'Continue shopping', title: 'Checkout',
    contact: 'Contact', fullName: 'Full name', email: 'Email', phone: 'Phone',
    delivery: 'Delivery', street: 'Street address', city: 'City', zip: 'Postal code', note: 'Order note (optional)',
    newsletter: 'Keep me posted on new drops and restocks',
    pay: (total: string) => `Pay ${total}`, redirecting: 'Redirecting to payment…',
    payNote: 'You’ll be taken to our payment provider’s secure page to pay by card, Bit, Apple Pay or Google Pay.',
    summary: 'Order summary', empty: 'Your bag is empty.', subtotal: 'Subtotal', shipping: 'Shipping', free: 'Free', total: 'Total',
    errors: {
      generic: 'Something went wrong. Please try again.',
      not_configured: 'Checkout is not available right now. Please try again later.',
      missing_fields: 'Please fill in all required fields.',
      invalid_email: 'Please check your email address.',
      missing_contact: 'Please fill in your name and phone.',
      empty_cart: 'Your bag is empty.',
      invalid_quantity: 'One of the quantities is not valid.',
      invalid_discount: 'That discount code is not valid.',
      unavailable: 'One of the items is no longer available.',
      out_of_stock: 'Sorry — one of the sizes in your bag just sold out.',
      catalogue: 'Could not load the catalogue. Please try again.',
    } as Record<string, string>,
  },
  success: {
    order: (n: string) => `Order #${n}`, title: 'Thank you.',
    demo: 'Your order is saved. Demo mode — no payment was taken yet; the payment page will appear here once it is connected.',
    paid: 'Your order is confirmed. A receipt is on its way to your inbox.',
    back: 'Back to the store',
  },
  colors: {} as Record<string, string>,
};

export type Dictionary = typeof en;

const he: Dictionary = {
  meta: { titleSuffix: 'קולקציה חדשה' },
  nav: { newIn: 'חדש באתר', shopAll: 'כל המוצרים', about: 'עלינו', home: 'דף הבית', main: 'ניווט ראשי', search: 'חיפוש', account: 'החשבון שלי', bag: (n: number) => `סל הקניות, ${n} פריטים`, switchTo: 'EN', switchToLabel: 'English site' },
  theme: { toLight: 'מעבר למצב בהיר', toDark: 'מעבר למצב כהה', light: 'מצב בהיר', dark: 'מצב כהה' },
  rail: {
    region: 'מתלה בגדים — גררו או השתמשו במקשי החצים',
    prev: 'הפריט הקודם', next: 'הפריט הבא', choose: 'בחירת פריט',
    hintStart: 'גררו את המתלה · הקישו על פריט כדי לסובב אותו',
    hintBack: 'הקישו שוב כדי לראות את הגב',
    hintOpen: 'הקישו שוב כדי לבחור מידה',
    bringFront: (name: string) => `הבאת ${name} לחזית`,
    tapContinue: (name: string) => `${name} — הקישו להמשך`,
    flatHintFine: 'העבירו את העכבר על פריט כדי לראות אותו מקדימה · לחיצה פותחת',
    flatHintTouch: 'הקישו על פריט כדי לראות אותו מקדימה · הקשה נוספת פותחת',
    featured: 'מומלץ',
    piecesOnRail: 'הפריטים על המתלה',
  },
  showcase: { hintFine: 'העבירו את העכבר או גררו את המתלה', hintTouch: 'החליקו את המתלה · הקישו לפתיחה', categories: 'קנייה לפי קטגוריה' },
  cta: { shopPiece: 'לרכישת הפריט', shopCollection: 'לכל הקולקציה' },
  collection: { title: 'הקולקציה', pieces: (n: number) => `${n} פריטים`, colors: (n: number) => (n === 1 ? 'צבע אחד' : `${n} צבעים`) },
  footer: { shipping: 'משלוחים', returns: 'החזרות והחלפות', terms: 'תקנון', accessibility: 'הצהרת נגישות', contact: 'צור קשר' },
  product: {
    close: 'סגירה', view: 'תצוגה', front: 'חזית', back: 'גב', frontAlt: (n: string) => `${n} — חזית`, backAlt: (n: string) => `${n} — גב`,
    color: 'צבע', size: 'מידה', soldOutSize: (s: string) => `${s} — אזל מהמלאי`,
    selectSize: 'בחרו מידה', addToBag: (price: string) => `הוספה לסל — ${price}`, added: 'נוסף לסל',
    onlyLeft: (n: number, s: string) => (n === 1 ? `נשאר פריט אחרון במידה ${s}` : `נשארו רק ${n} במידה ${s}`), soldOut: 'אזל מהמלאי',
  },
  cart: {
    title: (n: number) => `סל הקניות (${n})`, label: 'סל הקניות', close: 'סגירת הסל', empty: 'הסל שלך ריק.', keepExploring: 'להמשך קנייה',
    size: 'מידה', sizeOption: (s: string) => `מידה ${s}`, less: 'הפחתה', more: 'הוספה', remove: 'הסרה',
    subtotal: 'סכום ביניים', shippingNote: 'דמי המשלוח יחושבו בקופה.', checkout: 'לתשלום',
  },
  checkout: {
    secure: 'תשלום מאובטח', continue: 'חזרה לחנות', title: 'קופה',
    contact: 'פרטי התקשרות', fullName: 'שם מלא', email: 'אימייל', phone: 'טלפון',
    delivery: 'כתובת למשלוח', street: 'רחוב ומספר בית', city: 'עיר', zip: 'מיקוד', note: 'הערה להזמנה (לא חובה)',
    newsletter: 'עדכנו אותי על דרופים חדשים וחזרה למלאי',
    pay: (total: string) => `לתשלום ${total}`, redirecting: 'מעבירים לעמוד התשלום…',
    payNote: 'בלחיצה תועברו לעמוד התשלום המאובטח של חברת הסליקה — אפשר לשלם בכרטיס אשראי, ביט, Apple Pay או Google Pay.',
    summary: 'סיכום הזמנה', empty: 'הסל שלך ריק.', subtotal: 'סכום ביניים', shipping: 'משלוח', free: 'חינם', total: 'סה״כ לתשלום',
    errors: {
      generic: 'משהו השתבש. נסו שוב.',
      not_configured: 'התשלום לא זמין כרגע. נסו שוב מאוחר יותר.',
      missing_fields: 'נא למלא את כל שדות החובה.',
      invalid_email: 'נא לבדוק את כתובת האימייל.',
      missing_contact: 'נא למלא שם וטלפון.',
      empty_cart: 'הסל שלך ריק.',
      invalid_quantity: 'אחת הכמויות אינה תקינה.',
      invalid_discount: 'קוד ההנחה אינו בתוקף.',
      unavailable: 'אחד הפריטים כבר לא זמין.',
      out_of_stock: 'מצטערים — אחת המידות בסל אזלה הרגע מהמלאי.',
      catalogue: 'לא הצלחנו לטעון את הקטלוג. נסו שוב.',
    },
  },
  success: {
    order: (n: string) => `הזמנה מס׳ ${n}`, title: 'תודה רבה!',
    demo: 'ההזמנה נשמרה. האתר במצב הדגמה — עדיין לא בוצע חיוב, ועמוד התשלום יופיע כאן אחרי חיבור הסליקה.',
    paid: 'ההזמנה אושרה. הקבלה בדרך לתיבת המייל שלך.',
    back: 'חזרה לחנות',
  },
  colors: {
    White: 'לבן', Black: 'שחור', Navy: 'כחול כהה', Cream: 'שמנת', Ecru: 'אקרו', Charcoal: 'פחם', Forest: 'ירוק יער',
    Stone: 'אבן', Ash: 'אפור אפר', Slate: 'צפחה', Gray: 'אפור', Grey: 'אפור',
  },
};

export const dictionaries: Record<Locale, Dictionary> = { he, en };
