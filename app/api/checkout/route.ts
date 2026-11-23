import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { storeConfig } from '@/store.config';
import { createPaymentSession } from '@/lib/payments';
import { userFromRequest } from '@/lib/supabase/verify';
import { notifyAdmins } from '@/lib/push/server';

type Line = { productId: string; size: string; color: string; qty: number };
type Body = {
  lines?: Line[];
  customer?: { name?: string; email?: string; phone?: string; address?: string; city?: string; zip?: string; note?: string; newsletter?: string | boolean };
  locale?: string;
};

const KNOWN = new Set(['invalid_email', 'missing_contact', 'empty_cart', 'invalid_quantity', 'invalid_discount', 'unavailable', 'out_of_stock']);
// The page shows the message in the shopper's language; the API only returns a code.
const fail = (code: string, status: number) => NextResponse.json({ code }, { status });

export async function POST(req: Request) {
  const db = supabaseAdmin();
  if (!db) {
    console.error('[checkout] SUPABASE_SECRET_KEY is missing');
    return fail('not_configured', 503);
  }

  let body: Body;
  try { body = await req.json(); } catch { return fail('generic', 400); }
  const locale = 'en';
  const c = body.customer ?? {};
  for (const k of ['name', 'email', 'phone', 'address', 'city'] as const) {
    if (!String(c[k] ?? '').trim()) return fail('missing_fields', 400);
  }
  const lines = (body.lines ?? []).filter(l => l && l.productId && l.size);
  if (!lines.length) return fail('empty_cart', 400);

  // Resolve cart lines (product + size + color) to variant ids. Prices are never taken from the browser.
  const { data: variants, error: vErr } = await db
    .from('product_variants')
    .select('id, product_id, size, color')
    .in('product_id', Array.from(new Set(lines.map(l => l.productId))));
  if (vErr) return fail('catalogue', 502);

  const items = [];
  for (const l of lines) {
    const v = variants?.find(x => x.product_id === l.productId && x.size === l.size && x.color === l.color);
    if (!v) return fail('unavailable', 409);
    items.push({ variant_id: v.id, quantity: Math.floor(Number(l.qty)) });
  }

  const { data: order, error } = await db.rpc('place_order', {
    p: {
      email: c.email, name: c.name, phone: c.phone,
      address: { street: c.address, city: c.city, zip: c.zip ?? '' },
      note: c.note ?? '',
      locale,
      marketing_opt_in: c.newsletter === true || c.newsletter === 'on',
      shipping_price: storeConfig.commerce.shippingPrice,
      free_shipping_from: storeConfig.commerce.freeShippingFrom,
      items,
    },
  });
  if (error) {
    const code = (error.message || '').split(':')[0];
    if (!KNOWN.has(code)) console.error('[checkout] place_order failed:', error.message);
    return fail(KNOWN.has(code) ? code : 'generic', KNOWN.has(code) ? 409 : 500);
  }

  // alert the store owner's devices
  await notifyAdmins(db, {
    title: `🛍️ הזמנה חדשה #${order.order_number} — ₪${Number(order.total).toLocaleString('he-IL')}`,
    body: `${String(c.name).trim()} · ${String(c.city).trim()} · ${items.reduce((n, i) => n + i.quantity, 0)} פריטים`,
    url: `/admin#orders`,
    tag: `order-${order.order_number}`,
  });

  // signed-in shopper: attach the order to their account
  try {
    const user = await userFromRequest(db, req);
    if (user) {
      let { data: cust } = await db.from('customers').select('id').eq('auth_user_id', user.id).maybeSingle();
      if (!cust && user.email_confirmed_at && user.email?.toLowerCase() === String(c.email).trim().toLowerCase()) {
        ({ data: cust } = await db.from('customers').update({ auth_user_id: user.id }).eq('email', user.email.toLowerCase()).is('auth_user_id', null).select('id').maybeSingle());
      }
      if (cust) await db.from('orders').update({ customer_id: cust.id }).eq('id', order.order_id);
    }
  } catch (e) {
    console.error('[checkout] linking order to account failed:', (e as Error).message);
  }

  try {
    const session = await createPaymentSession({
      orderId: order.order_id, orderNumber: order.order_number, total: Number(order.total), currency: order.currency,
      email: String(c.email), name: String(c.name), phone: String(c.phone),
    }, new URL(req.url).origin, locale);
    return NextResponse.json({ redirectUrl: session.redirectUrl, orderNumber: order.order_number });
  } catch (e) {
    console.error('[checkout] payment session failed:', (e as Error).message);
    return fail('generic', 501);
  }
}
