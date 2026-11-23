// Currency comes from store.config.ts
import { storeConfig } from '@/store.config';

export const CURRENCY = storeConfig.commerce.currency;
const formatter = new Intl.NumberFormat(storeConfig.commerce.locale, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 });
export function formatPrice(amount: number) {
  return formatter.format(amount);
}
