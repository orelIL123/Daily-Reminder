'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useProducts } from '@/lib/useProducts';
import { formatPrice } from '@/lib/money';

const FREE_SHIPPING_FROM = 350;
const SHIPPING = 35;

export default function CheckoutPage() {
  const cart = useCart();
  const products = useProducts();
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
        body: JSON.stringify({ customer, lines: cart.lines.map(({ productId, size, color, qty }) => ({ productId, size, color, qty })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      window.location.href = data.redirectUrl;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="checkout">
      <header className="checkout-head">
        <Link href="/" className="brand">ATELIER<span>.</span></Link>
        <span className="secure"><Lock size={14} /> Secure checkout</span>
      </header>
      <div className="checkout-body">
        <form className="checkout-form" onSubmit={submit}>
          <Link href="/" className="back-link"><ArrowLeft size={14} /> Continue shopping</Link>
          <h1>Checkout</h1>
          <fieldset>
            <legend>Contact</legend>
            <label>Full name<input name="name" autoComplete="name" required /></label>
            <div className="row">
              <label>Email<input name="email" type="email" autoComplete="email" required /></label>
              <label>Phone<input name="phone" type="tel" autoComplete="tel" required /></label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Delivery</legend>
            <label>Street address<input name="address" autoComplete="street-address" required /></label>
            <div className="row">
              <label>City<input name="city" autoComplete="address-level2" required /></label>
              <label>Postal code<input name="zip" autoComplete="postal-code" /></label>
            </div>
          </fieldset>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn-primary btn-block" disabled={busy || rows.length === 0}>
            {busy ? 'Redirecting to payment…' : `Pay ${formatPrice(subtotal + shipping)}`}
          </button>
          <small className="pay-note">You’ll be taken to our payment provider’s secure page to pay by card, Bit, Apple Pay or Google Pay.</small>
        </form>

        <aside className="checkout-summary">
          <h2>Order summary</h2>
          {rows.length === 0 && <p>Your bag is empty.</p>}
          <ul>
            {rows.map(({ l, p }) => (
              <li key={l.key}>
                <div className="thumb"><img src={p!.frontImage} alt="" /><span>{l.qty}</span></div>
                <div><strong>{p!.name}</strong><small>{l.color} · {l.size}</small></div>
                <span>{formatPrice(p!.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl>
            <div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div><dt>Shipping</dt><dd>{shipping ? formatPrice(shipping) : 'Free'}</dd></div>
            <div className="total"><dt>Total</dt><dd>{formatPrice(subtotal + shipping)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
