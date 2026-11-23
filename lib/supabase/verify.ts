import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/** The signed-in user behind a request's `Authorization: Bearer <access token>`, or null. */
export async function userFromRequest(db: SupabaseClient, req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  return error ? null : data.user;
}

/** True when the request comes from a signed-in store admin. */
export async function isAdminRequest(db: SupabaseClient, req: Request) {
  const user = await userFromRequest(db, req);
  if (!user) return null;
  const { data } = await db.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  return data ? user : null;
}
