import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { isAdminRequest } from '@/lib/supabase/verify';
import { pushConfigured, sendPush } from '@/lib/push/server';

export const maxDuration = 60;

type Body = { title?: string; body?: string; url?: string };

/** Admin only: sends a notification to every subscribed device. */
export async function POST(req: Request) {
  const db = supabaseAdmin();
  if (!db || !pushConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const admin = await isAdminRequest(db, req);
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let b: Body;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }
  const title = String(b.title ?? '').trim().slice(0, 80);
  const text = String(b.body ?? '').trim().slice(0, 240);
  let url = String(b.url ?? '/').trim() || '/';
  if (!url.startsWith('/') || url.startsWith('//')) url = '/';
  if (!title) return NextResponse.json({ error: 'missing_title' }, { status: 400 });

  const { data: subs, error } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth');
  if (error) return NextResponse.json({ error: 'db' }, { status: 500 });
  const r = await sendPush(db, subs ?? [], { title, body: text, url });
  await db.from('push_messages').insert({ title, body: text, url, sent_count: r.sent, failed_count: r.failed, created_by: admin.id });
  return NextResponse.json(r);
}
