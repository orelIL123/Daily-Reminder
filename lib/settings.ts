import 'server-only';
import { cache } from 'react';
import { supabasePublic } from './supabase/public';
import { readTheme, type Theme } from './theme';
import { readSeo, type SeoSettings } from './seo';

/** The settings the owner edits in the admin. Falls back to the defaults if the database is unreachable. */
export const getSettings = cache(async (): Promise<{ theme: Theme; seo: SeoSettings }> => {
  const db = supabasePublic();
  let rows: { key: string; value: unknown }[] = [];
  if (db) {
    const { data, error } = await db.from('store_settings').select('key, value');
    if (error) console.error('[settings] could not load store settings:', error.message);
    rows = data ?? [];
  }
  const get = (k: string) => rows.find(r => r.key === k)?.value;
  return { theme: readTheme(get('theme')), seo: readSeo(get('seo')) };
});

/** The public address of the site: the domain from the admin, else the environment, else the Vercel address. */
export function siteUrl(seo: SeoSettings) {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return seo.siteUrl || process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || (vercel ? `https://${vercel}` : 'http://localhost:3000');
}
