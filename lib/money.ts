// One place to change the store currency. Israeli store → ILS (₪).
export const CURRENCY = 'ILS';
const formatter = new Intl.NumberFormat('en-IL', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 });
export function formatPrice(amount: number) {
  return formatter.format(amount);
}
