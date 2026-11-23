import 'server-only';
import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';
import { storeConfig } from '@/store.config';

export type PushPayload = { title: string; body?: string; url?: string; tag?: string };
type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

export function pushConfigured() {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

/** Send one payload to a list of subscriptions. Removes devices that unsubscribed. */
export async function sendPush(db: SupabaseClient, subs: Sub[], payload: PushPayload) {
  if (!pushConfigured()) return { sent: 0, failed: 0, removed: 0 };
  webpush.setVapidDetails(`mailto:${storeConfig.contact.email}`, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  const body = JSON.stringify({ tag: `dr-${Date.now()}`, ...payload });
  let sent = 0, failed = 0;
  const gone: string[] = [], ok: string[] = [];
  for (let i = 0; i < subs.length; i += 50) {
    await Promise.all(subs.slice(i, i + 50).map(async s => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 60 * 60 * 24, urgency: 'high' });
        sent++; ok.push(s.id);
      } catch (e) {
        failed++;
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.id);
      }
    }));
  }
  if (gone.length) await db.from('push_subscriptions').delete().in('id', gone);
  if (ok.length) await db.from('push_subscriptions').update({ last_success_at: new Date().toISOString() }).in('id', ok);
  return { sent, failed, removed: gone.length };
}

/** Push to every admin device that turned on order alerts. Never throws. */
export async function notifyAdmins(db: SupabaseClient, payload: PushPayload) {
  try {
    const { data } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth').not('admin_user_id', 'is', null);
    if (data?.length) await sendPush(db, data, payload);
  } catch (e) {
    console.error('[push] admin alert failed:', (e as Error).message);
  }
}
