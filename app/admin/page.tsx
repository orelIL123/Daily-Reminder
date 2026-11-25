'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import { BarChart3, Bell, ExternalLink, LogOut, Package, Search, ShoppingBag, Type, Warehouse } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { storeConfig } from '@/store.config';
import Login from './_components/Login';
import Orders from './_components/Orders';
import Products from './_components/Products';
import Inventory from './_components/Inventory';
import Notifications from './_components/Notifications';
import Analytics from './_components/Analytics';
import Design from './_components/Design';
import Seo from './_components/Seo';
import './admin.css';

type Tab = 'analytics' | 'orders' | 'products' | 'inventory' | 'notifications' | 'design' | 'seo';
const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: 'analytics', label: 'נתונים', icon: BarChart3 },
  { id: 'orders', label: 'הזמנות', icon: ShoppingBag },
  { id: 'products', label: 'מוצרים', icon: Package },
  { id: 'inventory', label: 'מלאי', icon: Warehouse },
  { id: 'notifications', label: 'התראות', icon: Bell },
  { id: 'design', label: 'עיצוב', icon: Type },
  { id: 'seo', label: 'SEO וגוגל', icon: Search },
];

export default function AdminPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('analytics');

  useEffect(() => {
    const db = supabaseBrowser();
    db.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = db.auth.onAuthStateChange((_e, s) => setSession(s));
    const fromHash = window.location.hash.replace('#', '') as Tab;
    if (TABS.some(t => t.id === fromHash)) setTab(fromHash);
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    // row-level security only lets admins read admin_users, so a row back means "admin"
    supabaseBrowser().from('admin_users').select('user_id').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  const go = useCallback((t: Tab) => { setTab(t); history.replaceState(null, '', `#${t}`); }, []);
  const signOut = () => supabaseBrowser().auth.signOut();

  if (session === undefined || (session && isAdmin === null)) return <div className="adm-loading" aria-busy="true" />;
  if (!session) return <Login />;
  if (!isAdmin) {
    return (
      <div className="adm-gate">
        <div className="adm-card">
          <h1>אין הרשאת ניהול</h1>
          <p>המשתמש {session.user.email} מחובר, אבל אינו מוגדר כמנהל בחנות.</p>
          <button className="adm-btn" onClick={signOut}>התנתקות</button>
        </div>
      </div>
    );
  }

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand">{storeConfig.brand.name}<span>ניהול</span></div>
        <nav>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={tab === id ? 'is-on' : ''} onClick={() => go(id)}><Icon size={17} /> {label}</button>
          ))}
        </nav>
        <div className="adm-side-foot">
          <Link href="/" target="_blank"><ExternalLink size={15} /> לאתר</Link>
          <button onClick={signOut}><LogOut size={15} /> התנתקות</button>
          <small>{session.user.email}</small>
        </div>
      </aside>
      <main className="adm-main">
        {tab === 'analytics' && <Analytics />}
        {tab === 'orders' && <Orders />}
        {tab === 'products' && <Products />}
        {tab === 'inventory' && <Inventory />}
        {tab === 'notifications' && <Notifications />}
        {tab === 'design' && <Design />}
        {tab === 'seo' && <Seo />}
      </main>
    </div>
  );
}
