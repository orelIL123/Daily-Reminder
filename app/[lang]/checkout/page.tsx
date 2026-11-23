'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabaseShopper } from '@/lib/supabase/shopper';
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
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ name: string; phone: string; email: string } | null>(null);
  const [makeAccount, setMakeAccount] = useState(false);

  // signed in: fill in what we know
  useEffect(() => {
    const db = supabaseShopper();
    if (!db) return;
    db.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      const u = data.session?.user;
      if (!u) return;
      const { data: cust } = await db.from('customers').select('name, phone').eq('auth_user_id', u.id).maybeSingle();
      setProfile({ email: u.email ?? '', name: cust?.name || String(u.user_metadata?.name ?? ''), phone: cust?.phone || String(u.user_metadata?.phone ?? '') });
    });
  }, []);

  const rows = cart.lines.map(l => ({ l, p: products.find(p => p.id === l.productId) })).filter(r => r.p);
  const subtotal = rows.reduce((s, r) => s + r.p!.price * r.l.qty, 0);
  const shipping = subtotal >= FREE_SHIPPING_FROM || subtotal === 0 ? 0 : SHIPPING;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError('');
    const form = Object.fromEntries(new FormData(e.currentTarget).entries());
    const { account_password, ...customer } = form;
    try {
      // optional: create the account first, so this order already belongs to it
      let token = session?.access_token;
      const db = supabaseShopper();
      if (!session && makeAccount && db && String(account_password ?? '').length >= 8) {
        const { data } = await db.auth.signUp({
          email: String(customer.email), password: String(account_password),
          options: { data: { name: String(customer.name), phone: String(customer.phone) }, emailRedirectTo: `${window.location.origin}/account` },
        });
        token = data.session?.access_token;
      }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
        <Link href={href('/')} className="brand">{storeConfig.brand.name}{storeConfig.brand.accentDot && <span>.</span>}</Link>
        <span className="secure"><Lock size={14} /> {c.secure}</span>
      </header>
      <div className="checkout-body">
        <form className="checkout-form" onSubmit={submit}>
          <Link href={href('/')} className="back-link"><ArrowLeft size={14} className="dir-icon" /> {c.continue}</Link>
          <h1>{c.title}</h1>
          <fieldset>
            <legend>{c.contact}</legend>
            <label>{c.fullName}<input name="name" autoComplete="name" required defaultValue={profile?.name} key={`n${profile?.name}`} /></label>
            <div className="row">
              <label>{c.email}<input name="email" type="email" autoComplete="email" required defaultValue={profile?.email} key={`e${profile?.email}`} /></label>
              <label>{c.phone}<input name="phone" type="tel" autoComplete="tel" required defaultValue={profile?.phone} key={`p${profile?.phone}`} /></label>
            </div>
          </fieldset>
          <fieldset>
            <legend>{c.delivery}</legend>
            <label>{c.street}<input name="address" autoComplete="street-address" required /></label>
            <div className="row">
              <label>{c.city}<input name="city" autoComplete="address-level2" required /></label>
              <label>{c.zip}<input name="zip" autoComplete="postal-code" inputMode="numeric" /></label>
            </div>
            <label>{c.note}<input name="note" /></label>
          </fieldset>
          <div className="checkout-account">
            {session ? (
              <span className="signed-in">{c.signedInAs(session.user.email ?? '')}</span>
            ) : (
              <>
                <label className="check">
                  <input type="checkbox" checked={makeAccount} onChange={e => setMakeAccount(e.target.checked)} />
                  <span>{c.createAccount}</span>
                </label>
                {makeAccount && (
                  <label>{c.accountPassword}<input name="account_password" type="password" autoComplete="new-password" minLength={8} required /></label>
                )}
                <Link href={href('/account') + '?next=/checkout'}>{c.haveAccount}</Link>
              </>
            )}
          </div>
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
