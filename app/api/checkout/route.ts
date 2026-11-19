import { NextResponse } from 'next/server';
import { initialProducts } from '@/lib/products';
import { CURRENCY } from '@/lib/money';
import { storeConfig } from '@/store.config';
import { createPaymentSession, type Customer, type Order, type OrderLine } from '@/lib/payments';

const FREE_SHIPPING_FROM = storeConfig.commerce.freeShippingFrom;
const SHIPPING = storeConfig.commerce.shippingPrice;

type Body = { lines?: { productId: string; size: string; color: string; qty: number }[]; customer?: Partial<Customer> };

export async function POST(req: Request) {
  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  const c = body.customer ?? {};
  const required: (keyof Customer)[] = ['name', 'email', 'phone', 'address', 'city'];
  const missing = required.filter(k => !String(c[k] ?? '').trim());
  if (missing.length) return NextResponse.json({ error: `Missing: ${missing.join(', ')}` }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(String(c.email))) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });

  // Prices always come from the server-side catalogue, never from the browser.
  const lines: OrderLine[] = [];
  for (const l of body.lines ?? []) {
    const p = initialProducts.find(x => x.id === l.productId);
    const qty = Math.floor(Number(l.qty));
    if (!p || !p.sizes.includes(l.size) || !p.colors.includes(l.color) || qty < 1 || qty > 20) {
      return NextResponse.json({ error: 'One of the items is no longer available' }, { status: 400 });
    }
    lines.push({ productId: p.id, name: p.name, size: l.size, color: l.color, qty, unitPrice: p.price });
  }
  if (!lines.length) return NextResponse.json({ error: 'Your bag is empty' }, { status: 400 });

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING;
  const order: Order = {
    id: `DR-${Date.now().toString(36).toUpperCase()}`,
    lines, subtotal, shipping, total: subtotal + shipping, currency: CURRENCY,
    customer: c as Customer,
  };

  try {
    const session = await createPaymentSession(order, new URL(req.url).origin);
    return NextResponse.json({ redirectUrl: session.redirectUrl, orderId: order.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 501 });
  }
}
