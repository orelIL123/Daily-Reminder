'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Check, LogOut } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import NotifyButton from '@/components/NotifyButton';
import { supabaseShopper } from '@/lib/supabase/shopper';
import { useI18n } from '@/lib/i18n/client';

type Order = { id: string; order_number: number; status: string; total: number; created_at: string; order_items: { name: string; size: string; quantity: number }[] };
type Mode = 'signin' | 'signup' | 'forgot' | 'reset';

export default function AccountPage() {
  const { t, price } = useI18n();
  const a = t.account;
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [mode, setMode] = useState<Mode>('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    const db = supabaseShopper();
    if (!db) { setSession(null); return; }
    db.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = db.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setMode('reset');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    const db = supabaseShopper();
    if (!db || !session) return;
    await db.rpc('link_my_customer');
    const [{ data: cust }, { data }] = await Promise.all([
      db.from('customers').select('name').eq('auth_user_id', session.user.id).maybeSingle(),
      db.from('orders').select('id, order_number, status, total, created_at, order_items(name, size, quantity)').order('created_at', { ascending: false }).limit(30),
    ]);
    setName(cust?.name || String(session.user.user_metadata?.name ?? ''));
    setOrders((data ?? []) as Order[]);
  }, [session]);

  useEffect(() => {
    if (!session || mode === 'reset') return;
    const next = new URLSearchParams(window.location.search).get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) { window.location.href = next; return; }
    load();
  }, [session, mode, load]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const db = supabaseShopper();
    if (!db) return;
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') ?? '').trim();
    const password = String(f.get('password') ?? '');
    setBusy(true); setError(''); setMsg('');
    try {
      if (mode === 'signin') {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'signup') {
        if (password.length < 8) throw new Error('weak');
        const { data, error } = await db.auth.signUp({
          email, password,
          options: { data: { name: String(f.get('name') ?? ''), phone: String(f.get('phone') ?? '') }, emailRedirectTo: `${window.location.origin}/account` },
        });
        if (error) throw error;
        if (data.user && data.user.identities?.length === 0) throw new Error('exists');
        if (!data.session) setMsg(a.checkEmail);
      } else if (mode === 'forgot') {
        const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/account` });
        if (error) throw error;
        setMsg(a.resetSent);
      } else if (mode === 'reset') {
        if (password.length < 8) throw new Error('weak');
        const { error } = await db.auth.updateUser({ password });
        if (error) throw error;
        setMsg(a.passwordSaved);
        setMode('signin');
      }
    } catch (err) {
      const m = (err as Error).message || '';
      setError(
        m === 'weak' || /password/i.test(m) && /least|short|weak/i.test(m) ? a.errors.weak
          : m === 'exists' || /already registered/i.test(m) ? a.errors.exists
          : /invalid login/i.test(m) ? a.errors.invalid
          : /not confirmed/i.test(m) ? a.errors.unconfirmed
          : a.errors.generic,
      );
    }
    setBusy(false);
  }

  const signOut = () => supabaseShopper()?.auth.signOut();
  const date = (iso: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="account">
        {session === undefined ? null : session && mode !== 'reset' ? (
          <div className="account-inner">
            <div>
              <h1>{a.welcome(name)}</h1>
              <p className="account-lead">{session.user.email}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <NotifyButton />
                <button className="btn-outline" onClick={signOut}><LogOut size={15} /> {a.signOut}</button>
              </div>
            </div>
            <div className="account-card">
              <div className="account-head"><h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{a.orders}</h2></div>
              {orders === null ? null : orders.length === 0 ? <p className="account-lead">{a.noOrders}</p> : (
                <ul className="account-orders">
                  {orders.map(o => (
                    <li key={o.id}>
                      <strong>{a.order(o.order_number)}</strong>
                      <span className="pill">{a.status[o.status] ?? o.status}</span>
                      <small>{date(o.created_at)} · {o.order_items.map(i => `${i.name} (${i.size})${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ')}</small>
                      <span style={{ justifySelf: 'end' }}>{price(Number(o.total))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="account-inner">
            <div>
              <h1>{a.title}</h1>
              <p className="account-lead">{a.optional}</p>
              <ul className="account-perks">{a.perks.map(p => <li key={p}><Check size={16} /> {p}</li>)}</ul>
            </div>
            <div className="account-card">
              {(mode === 'signin' || mode === 'signup') && (
                <div className="account-tabs" role="tablist">
                  <button role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'is-on' : ''} onClick={() => { setMode('signin'); setError(''); }}>{a.signIn}</button>
                  <button role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'is-on' : ''} onClick={() => { setMode('signup'); setError(''); }}>{a.signUp}</button>
                </div>
              )}
              <form className="account-form" onSubmit={submit}>
                {mode === 'signup' && <label>{a.name}<input name="name" autoComplete="name" required /></label>}
                {mode !== 'reset' && <label>{a.email}<input name="email" type="email" autoComplete="email" required /></label>}
                {mode === 'signup' && <label>{a.phone}<input name="phone" type="tel" autoComplete="tel" /></label>}
                {mode !== 'forgot' && (
                  <label>{mode === 'reset' ? a.newPassword : a.password}
                    <input name="password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={mode === 'signin' ? undefined : 8} required />
                  </label>
                )}
                {error && <p className="form-error" role="alert">{error}</p>}
                {msg && <p className="account-msg" role="status">{msg}</p>}
                <button className="btn-primary btn-block" disabled={busy}>
                  {mode === 'signin' ? a.signIn : mode === 'signup' ? a.signUp : mode === 'forgot' ? a.sendReset : a.savePassword}
                </button>
                {mode === 'signin' && <button type="button" className="link-btn" onClick={() => { setMode('forgot'); setError(''); setMsg(''); }}>{a.forgot}</button>}
                {mode === 'forgot' && <button type="button" className="link-btn" onClick={() => setMode('signin')}>{a.signIn}</button>}
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
