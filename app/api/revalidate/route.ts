import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { isAdminRequest } from '@/lib/supabase/verify';

/** Admin only: rebuild the public pages now, so saved changes show immediately. */
export async function POST(req: Request) {
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  if (!(await isAdminRequest(db, req))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  revalidatePath('/', 'layout');
  revalidatePath('/sitemap.xml');
  revalidatePath('/robots.txt');
  return NextResponse.json({ ok: true });
}
