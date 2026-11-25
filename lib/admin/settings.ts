'use client';
import { supabaseBrowser } from '@/lib/supabase/browser';

export async function loadSetting(key: 'theme' | 'seo'): Promise<unknown> {
  const { data, error } = await supabaseBrowser().from('store_settings').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

export async function saveSetting(key: 'theme' | 'seo', value: object) {
  const { error } = await supabaseBrowser().from('store_settings').upsert({ key, value });
  if (error) throw error;
  return publishNow();
}

/** Rebuild the public pages right away. If it fails they still refresh within about a minute. */
export async function publishNow(): Promise<boolean> {
  try {
    const { data } = await supabaseBrowser().auth.getSession();
    const res = await fetch('/api/revalidate', { method: 'POST', headers: { Authorization: `Bearer ${data.session?.access_token}` } });
    return res.ok;
  } catch { return false; }
}
