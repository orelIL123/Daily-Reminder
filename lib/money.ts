// Currency comes from store.config.ts
import { storeConfig } from '@/store.config';

export const CURRENCY = storeConfig.commerce.currency;
const formatters = {
  he: new Intl.NumberFormat(storeConfig.commerce.locales.he, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }),
  en: new Intl.NumberFormat(storeConfig.commerce.locales.en, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }),
};
export function formatPrice(amount: number, lang: 'he' | 'en' = 'he') {
  return formatters[lang].format(amount);
}
