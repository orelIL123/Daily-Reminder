import type { Locale } from './config';

/*
 * Interface text for every store built from this kit.
 * Store-specific copy (slogans, categories, perks) lives in store.config.ts.
 */

const en = {
  meta: { titleSuffix: 'New Collection' },
  nav: { newIn: 'New in', shopAll: 'Shop all', about: 'About', home: 'Home', main: 'Main', search: 'Search', account: 'Account', bag: (n: number) => `Bag, ${n} item${n === 1 ? '' : 's'}`, menu: 'Menu', closeMenu: 'Close menu' },
  rail: {
    region: 'Clothing rail — drag or use arrow keys',
    prev: 'Previous piece', next: 'Next piece', choose: 'Choose a piece',
    hintStart: 'Drag the rail · tap the centred piece to choose a size',
    bringFront: (name: string) => `Bring ${name} to the front`,
    tapContinue: (name: string) => `${name} — tap to continue`,
    flatHintFine: 'Hover a piece to see the front · click to open',
    flatHintTouch: 'Tap a piece to see the front · tap again to open',
    featured: 'Featured',
    piecesOnRail: 'Pieces on the rail',
  },
  showcase: { hintFine: 'Hover or drag the rail to explore', hintTouch: 'Swipe the rail · tap to open', categories: 'Shop by category' },
  cta: { shopPiece: 'Shop this piece', shopCollection: 'Shop the collection' },
  collection: { title: 'The collection', pieces: (n: number) => `${n} piece${n === 1 ? '' : 's'}`, colors: (n: number) => `${n} color${n === 1 ? '' : 's'}`, all: 'All', filter: 'Filter by category', comingSoon: 'New pieces are on their way. Turn on notifications to hear first.' },
  editorial: { label: 'Behind the collection' },
  footer: { shipping: 'Shipping', returns: 'Returns', terms: 'Terms', accessibility: 'Accessibility', contact: 'Contact', privacy: 'Privacy', followUs: 'Get in touch' },
  app: {
    install: 'Add to home screen', installTitle: 'Daily Reminder on your home screen',
    installText: 'One tap to the store, plus first word on new drops.',
    iosSteps: 'Tap the Share button, then “Add to Home Screen”.',
    androidSteps: 'Open your browser menu (⋮) and choose “Add to Home screen” or “Install app”.',
    iosPushNote: 'On iPhone, notifications work once the app is on your home screen.',
    notify: 'Turn on notifications', notifyOn: 'Notifications are on', notifyBlocked: 'Notifications are blocked in your browser settings.',
    notifyFail: 'Could not turn on notifications. Please try again.', notNow: 'Not now', close: 'Close',
  },
  account: {
    title: 'Your account', signIn: 'Sign in', signUp: 'Create account', signOut: 'Sign out',
    email: 'Email', password: 'Password', name: 'Full name', phone: 'Phone',
    newHere: 'New here?', haveAccount: 'Already have an account?',
    forgot: 'Forgot your password?', sendReset: 'Send reset link', resetSent: 'Check your inbox for a link to set a new password.',
    newPassword: 'New password', savePassword: 'Save password', passwordSaved: 'Your password is updated.',
    checkEmail: 'Almost there — confirm your email from the message we just sent, then sign in.',
    welcome: (n: string) => (n ? `Welcome back, ${n.split(' ')[0]}.` : 'Welcome back.'),
    perks: ['Track your orders', 'Faster checkout', 'First access to new drops'],
    optional: 'An account is optional — you can always check out as a guest.',
    orders: 'Your orders', noOrders: 'No orders yet.', order: (n: number) => `Order #${n}`,
    status: {
      pending_payment: 'Awaiting payment', paid: 'Paid', processing: 'Being prepared', shipped: 'Shipped',
      delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
    } as Record<string, string>,
    errors: {
      invalid: 'Email or password is incorrect.', weak: 'Use at least 8 characters for your password.',
      exists: 'An account with this email already exists — sign in instead.', generic: 'Something went wrong. Please try again.',
      unconfirmed: 'Please confirm your email first — check your inbox.',
    } as Record<string, string>,
  },
  product: {
    close: 'Close', view: 'View', details: 'Details', description: 'About this piece', category: 'Category', front: 'Front', back: 'Back', frontAlt: (n: string) => `${n} — front`, backAlt: (n: string) => `${n} — back`,
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
    createAccount: 'Create an account for faster checkout and order tracking (recommended)',
    accountPassword: 'Choose a password (8+ characters)',
    signedInAs: (e: string) => `Signed in as ${e}`,
    haveAccount: 'Have an account? Sign in',
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

export const dictionaries: Record<Locale, Dictionary> = { en };
