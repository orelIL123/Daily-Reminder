'use client';

import { useCallback, useEffect, useState } from 'react';
import { BellRing, RefreshCw, Send } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { when } from '@/lib/admin/types';
import OrderAlerts from './OrderAlerts';

type Msg = { id: number; title: string; body: string; url: string; sent_count: number; failed_count: number; created_at: string };

// quick starts — the brand is "Daily Reminder", so a short daily-style line works well
const TEMPLATES = [
  { label: 'דרופ חדש', title: 'New drop is live', body: 'The new collection just landed on the rail. Tap to take a look.', url: '/' },
  { label: 'חזר למלאי', title: 'Back in stock', body: 'Your favourites are back on the rail — sizes go fast.', url: '/#collection' },
  { label: 'מבצע', title: 'Today only', body: 'Free shipping on every order, today only.', url: '/' },
  { label: 'תזכורת יומית', title: 'Your daily reminder', body: 'Keep going. Small steps, every day.', url: '/' },
];

export default function Notifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [subs, setSubs] = useState<number | null>(null);
  const [history, setHistory] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const db = supabaseBrowser();
    const [c, h] = await Promise.all([
      db.from('push_subscriptions').select('id', { count: 'exact', head: true }),
      db.from('push_messages').select('*').order('created_at', { ascending: false }).limit(20),
    ]);
    setSubs(c.count ?? 0);
    setHistory((h.data ?? []) as Msg[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function send() {
    setError(''); setResult('');
    if (!title.trim()) return setError('נא לכתוב כותרת.');
    if (!window.confirm(`לשלוח את ההתראה ל־${subs ?? 0} מכשירים?`)) return;
    setBusy(true);
    try {
      const { data } = await supabaseBrowser().auth.getSession();
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
        body: JSON.stringify({ title, body, url }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error === 'not_configured' ? 'התראות עדיין לא מוגדרות בשרת (חסרים מפתחות VAPID).' : out.error === 'forbidden' ? 'אין הרשאה.' : 'השליחה נכשלה.');
      setResult(`נשלח ל־${out.sent} מכשירים${out.failed ? ` · ${out.failed} נכשלו` : ''}${out.removed ? ` · ${out.removed} מכשירים שהסירו את האפליקציה נוקו מהרשימה` : ''}.`);
      setTitle(''); setBody('');
      load();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <section>
      <header className="adm-head">
        <div><h1>התראות</h1><p>{subs === null ? '…' : `${subs} מכשירים רשומים לקבלת התראות`}</p></div>
        <div className="adm-head-actions"><button className="adm-btn" onClick={load}><RefreshCw size={15} /> רענון</button></div>
      </header>

      <div className="adm-card" style={{ display: 'grid', gap: 10, marginBottom: 22 }}>
        <h3 style={{ margin: 0 }}>התראה למנהל על כל הזמנה</h3>
        <p className="adm-note" style={{ margin: 0 }}>הפעילו בכל מכשיר שעליו תרצו לקבל התראה (טלפון, מחשב). ההתראה מגיעה ברגע שלקוח מבצע הזמנה, עם המספר, הסכום והעיר — לחיצה פותחת את ההזמנות.</p>
        <OrderAlerts />
      </div>

      <h2 style={{ fontSize: 18, margin: '0 0 12px' }}>שליחת הודעה ללקוחות</h2>
      <div className="adm-push">
        <div>
          <div className="adm-card" style={{ display: 'grid', gap: 12 }}>
            <p className="adm-note" style={{ margin: 0 }}>ההודעה תגיע לכל מי שאישר התראות — באנדרואיד ובמחשב מהדפדפן, ובאייפון אחרי שהוסיפו את האתר למסך הבית. כתבו באנגלית, כמו שאר האתר.</p>
            <div className="adm-templates">
              {TEMPLATES.map(t => <button key={t.label} onClick={() => { setTitle(t.title); setBody(t.body); setUrl(t.url); }}>{t.label}</button>)}
            </div>
            <label>כותרת (עד 80 תווים)<input value={title} maxLength={80} onChange={e => setTitle(e.target.value)} dir="ltr" placeholder="New drop is live" /></label>
            <label>טקסט (עד 240 תווים)<textarea value={body} maxLength={240} rows={3} onChange={e => setBody(e.target.value)} dir="ltr" placeholder="The new collection just landed on the rail." style={{ font: 'inherit', fontSize: 14.5, border: '1px solid var(--a-line)', borderRadius: 10, padding: '10px 12px' }} /></label>
            <label>לאן ההתראה תוביל בלחיצה<input value={url} onChange={e => setUrl(e.target.value)} dir="ltr" placeholder="/" /></label>
            {error && <p className="adm-error" role="alert">{error}</p>}
            {result && <p className="adm-info" role="status"><BellRing size={14} /> {result}</p>}
            <div><button className="adm-btn adm-btn-dark" onClick={send} disabled={busy || !subs}><Send size={15} /> {busy ? 'שולחים…' : 'שליחה לכולם'}</button></div>
          </div>

          <h3 style={{ margin: '28px 0 12px' }}>נשלחו לאחרונה</h3>
          {history.length === 0 ? <p className="adm-note">עדיין לא נשלחו התראות.</p> : (
            <ul className="adm-sent">
              {history.map(m => (
                <li key={m.id}>
                  <b dir="ltr" style={{ textAlign: 'right' }}>{m.title}</b>
                  <small>{when(m.created_at)}</small>
                  <small dir="ltr" style={{ textAlign: 'right' }}>{m.body}</small>
                  <small>נשלח ל־{m.sent_count}{m.failed_count ? ` · ${m.failed_count} נכשלו` : ''}</small>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="adm-phone" aria-label="תצוגה מקדימה">
          <small>9:41</small>
          <div className="adm-notif">
            <img src="/icons/icon-192.png" alt="" />
            <div>
              <b><span className="ttl">{title || 'New drop is live'}</span><span>now</span></b>
              <p>{body || 'The new collection just landed on the rail.'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
