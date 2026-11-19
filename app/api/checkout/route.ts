import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { storeConfig } from '@/store.config';
import { createPaymentSession } from '@/lib/payments';

type Line = { productId: string; size: string; color: string; qty: number };
type Body = {
  lines?: Line[];
  customer?: { name?: string; email?: string; phone?: string; address?: string; city?: string; zip?: string; note?: string; newsletter?: string | boolean };
  locale?: string;
};

// Database error codes → messages the shopper can act on
const MESSAGES: Record<string, string> = {
  invalid_email: 'Please check your email address.',
  missing_contact: 'Please fill in your name and phone.',
  empty_cart: 'Your bag is empty.',
  invalid_quantity: 'One of the quantities is not valid.',
  invalid_discount: 'That discount code is not valid.',
  unavailable: 'One of the items is no longer available.',
  out_of_stock: 'Sorry — one of the sizes in your bag just sold out.',
};

export async function POST(req: Request) {
  const db = supabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Checkout is not configured yet (SUPABASE_SECRET_KEY is missing).' }, { status: 503 });
  }

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const c = body.customer ?? {};
  for (const k of ['name', 'email', 'phone', 'address', 'city'] as const) {
    if (!String(c[k] ?? '').trim()) return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 });
  }
  const lines = (body.lines ?? []).filter(l => l && l.productId && l.size);
  if (!lines.length) return NextResponse.json({ error: MESSAGES.empty_cart }, { status: 400 });

  // Resolve cart lines (product + size + color) to variant ids. Prices are never taken from the browser.
  const { data: variants, error: vErr } = await db
    .from('product_variants')
    .select('id, product_id, size, color')
    .in('product_id', Array.from(new Set(lines.map(l => l.productId))));
  if (vErr) return NextResponse.json({ error: 'Could not load the catalogue. Please try again.' }, { status: 502 });

  const items = [];
  for (const l of lines) {
    const v = variants?.find(x => x.product_id === l.productId && x.size === l.size && x.color === l.color);
    if (!v) return NextResponse.json({ error: MESSAGES.unavailable }, { status: 409 });
    items.push({ variant_id: v.id, quantity: Math.floor(Number(l.qty)) });
  }

  const { data: order, error } = await db.rpc('place_order', {
    p: {
      email: c.email, name: c.name, phone: c.phone,
      address: { street: c.address, city: c.city, zip: c.zip ?? '' },
      note: c.note ?? '',
      locale: body.locale === 'en' ? 'en' : 'he',
      marketing_opt_in: c.newsletter === true || c.newsletter === 'on',
      shipping_price: storeConfig.commerce.shippingPrice,
      free_shipping_from: storeConfig.commerce.freeShippingFrom,
      items,
    },
  });
  if (error) {
    const code = (error.message || '').split(':')[0];
    return NextResponse.json({ error: MESSAGES[code] ?? 'Something went wrong placing the order.' }, { status: code ? 409 : 500 });
  }

  try {
    const session = await createPaymentSession({
      orderId: order.order_id, orderNumber: order.order_number, total: Number(order.total), currency: order.currency,
      email: String(c.email), name: String(c.name), phone: String(c.phone),
    }, new URL(req.url).origin);
    return NextResponse.json({ redirectUrl: session.redirectUrl, orderNumber: order.order_number });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 501 });
  }
}
