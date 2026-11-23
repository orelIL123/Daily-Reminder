import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { isAdminRequest } from '@/lib/supabase/verify';

type Body = { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }; standalone?: boolean; orderAlerts?: boolean };

/** Saves (or refreshes) one device's push subscription. */
export async function POST(req: Request) {
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }
  const s = body.subscription;
  const endpoint = s?.endpoint ?? '';
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !s?.keys?.p256dh || !s.keys.auth) {
    return NextResponse.json({ error: 'bad_subscription' }, { status: 400 });
  }
  // an admin (signed in, Bearer token) can turn on new-order alerts for this device
  const admin = body.orderAlerts ? await isAdminRequest(db, req) : null;
  if (body.orderAlerts && !admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { error } = await db.from('push_subscriptions').upsert({
    ...(admin ? { admin_user_id: admin.id } : {}),
    endpoint, p256dh: s.keys.p256dh.slice(0, 200), auth: s.keys.auth.slice(0, 100),
    user_agent: (req.headers.get('user-agent') ?? '').slice(0, 300), standalone: !!body.standalone,
  }, { onConflict: 'endpoint' });
  if (error) { console.error('[push] save failed', error.message); return NextResponse.json({ error: 'save_failed' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
