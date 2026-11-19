'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useProducts } from '@/lib/useProducts';
import { useI18n } from '@/lib/i18n/client';
import { storeConfig } from '@/store.config';

const FREE_SHIPPING_FROM = storeConfig.commerce.freeShippingFrom;
const SHIPPING = storeConfig.commerce.shippingPrice;

export default function CheckoutPage() {
  const cart = useCart();
  const products = useProducts();
  const { t, lang, href, name, price, color } = useI18n();
  const c = t.checkout;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const rows = cart.lines.map(l => ({ l, p: products.find(p => p.id === l.productId) })).filter(r => r.p);
  const subtotal = rows.reduce((s, r) => s + r.p!.price * r.l.qty, 0);
  const shipping = subtotal >= FREE_SHIPPING_FROM || subtotal === 0 ? 0 : SHIPPING;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError('');
    const customer = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: lang,
          customer: { ...customer, newsletter: customer.newsletter === 'on' },
          lines: cart.lines.map(({ productId, size, color, qty }) => ({ productId, size, color, qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(c.errors[data.code] ?? c.errors.generic);
      window.location.href = data.redirectUrl;
    } catch (err) {
      setError(err instanceof TypeError ? c.errors.generic : (err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="checkout">
      <header className="checkout-head">
        <Link href={href('/')} className="brand"><bdi dir="ltr">{storeConfig.brand.name}{storeConfig.brand.accentDot && <span>.</span>}</bdi></Link>
        <span className="secure"><Lock size={14} /> {c.secure}</span>
      </header>
      <div className="checkout-body">
        <form className="checkout-form" onSubmit={submit}>
          <Link href={href('/')} className="back-link"><ArrowLeft size={14} className="dir-icon" /> {c.continue}</Link>
          <h1>{c.title}</h1>
          <fieldset>
            <legend>{c.contact}</legend>
            <label>{c.fullName}<input name="name" autoComplete="name" required /></label>
            <div className="row">
              <label>{c.email}<input name="email" type="email" autoComplete="email" dir="ltr" required /></label>
              <label>{c.phone}<input name="phone" type="tel" autoComplete="tel" dir="ltr" required /></label>
            </div>
          </fieldset>
          <fieldset>
            <legend>{c.delivery}</legend>
            <label>{c.street}<input name="address" autoComplete="street-address" required /></label>
            <div className="row">
              <label>{c.city}<input name="city" autoComplete="address-level2" required /></label>
              <label>{c.zip}<input name="zip" autoComplete="postal-code" inputMode="numeric" dir="ltr" /></label>
            </div>
            <label>{c.note}<input name="note" /></label>
          </fieldset>
          <label className="check">
            <input type="checkbox" name="newsletter" defaultChecked />
            <span>{c.newsletter}</span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn-primary btn-block" disabled={busy || rows.length === 0}>
            {busy ? c.redirecting : c.pay(price(subtotal + shipping))}
          </button>
          <small className="pay-note">{c.payNote}</small>
        </form>

        <aside className="checkout-summary">
          <h2>{c.summary}</h2>
          {rows.length === 0 && <p>{c.empty}</p>}
          <ul>
            {rows.map(({ l, p }) => (
              <li key={l.key}>
                <div className="thumb"><img src={p!.frontImage} alt="" /><span>{l.qty}</span></div>
                <div><strong>{name(p!)}</strong><small>{color(l.color)} · {l.size}</small></div>
                <span>{price(p!.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl>
            <div><dt>{c.subtotal}</dt><dd>{price(subtotal)}</dd></div>
            <div><dt>{c.shipping}</dt><dd>{shipping ? price(shipping) : c.free}</dd></div>
            <div className="total"><dt>{c.total}</dt><dd>{price(subtotal + shipping)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
