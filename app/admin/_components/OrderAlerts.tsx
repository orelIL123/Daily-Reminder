'use client';

import { useEffect, useState } from 'react';
import { BellRing, BellPlus } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { enablePush, isIOS, isStandalone, pushState } from '@/lib/push';

const KEY = 'dr-admin-order-alerts';

/** Turns on a push notification on THIS device for every new order. */
export default function OrderAlerts({ compact = false }: { compact?: boolean }) {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [needsInstall, setNeedsInstall] = useState(false);

  useEffect(() => {
    let flag = false;
    try { flag = localStorage.getItem(KEY) === '1'; } catch { /* ignore */ }
    setOn(flag && typeof Notification !== 'undefined' && Notification.permission === 'granted');
    setNeedsInstall(pushState() === 'needs-install' || (isIOS() && !isStandalone()));
  }, []);

  async function turnOn() {
    setBusy(true); setMsg('');
    try {
      const { data } = await supabaseBrowser().auth.getSession();
      const s = await enablePush({ orderAlerts: true, token: data.session?.access_token });
      if (s === 'granted') { setOn(true); try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ } setMsg('מעכשיו תקבלו התראה במכשיר הזה על כל הזמנה חדשה.'); }
      else setMsg('ההתראות חסומות. אפשרו אותן בהגדרות הדפדפן/הטלפון ונסו שוב.');
    } catch (e) {
      setMsg((e as Error).message === 'push_not_configured' ? 'חסרים מפתחות VAPID בשרת — ראו הוראות התקנה.' : 'ההפעלה נכשלה. נסו שוב.');
    }
    setBusy(false);
  }

  if (needsInstall && !on) {
    return <p className="adm-note" style={{ margin: 0 }}>📱 באייפון: פתחו את עמוד הניהול ב־Safari, לחצו על כפתור השיתוף ← "הוספה למסך הבית", פתחו מהאייקון החדש — ואז הפעילו כאן התראות על הזמנות.</p>;
  }
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {on
        ? <span className="adm-info"><BellRing size={14} /> התראות על הזמנות פעילות במכשיר הזה</span>
        : <button className={`adm-btn ${compact ? '' : 'adm-btn-dark'}`} onClick={turnOn} disabled={busy}><BellPlus size={15} /> {busy ? 'מפעילים…' : 'קבלת התראה על כל הזמנה'}</button>}
      {msg && !compact && <small style={{ color: 'var(--a-sub)' }}>{msg}</small>}
    </div>
  );
}
