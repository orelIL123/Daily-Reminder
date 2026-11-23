'use client';

import { useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { enablePush, pushState, type PushState } from '@/lib/push';
import { useI18n } from '@/lib/i18n/client';

/** "Turn on notifications" — subscribes this device to the admin's push messages. */
export default function NotifyButton({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { setState(pushState()); }, []);
  if (!state || state === 'unsupported') return null;

  async function turnOn() {
    if (state === 'needs-install') { window.dispatchEvent(new Event('dr-show-install')); return; }
    setBusy(true); setMsg('');
    try {
      const s = await enablePush();
      setState(s);
      if (s === 'denied') setMsg(t.app.notifyBlocked);
    } catch { setMsg(t.app.notifyFail); }
    setBusy(false);
  }

  if (state === 'granted') {
    return <span className={`notify-btn is-on ${compact ? 'is-compact' : ''}`}><BellRing size={14} strokeWidth={1.5} /> {t.app.notifyOn}</span>;
  }
  if (state === 'denied') return compact ? null : <span className="notify-msg">{t.app.notifyBlocked}</span>;
  return (
    <>
      <button className={`notify-btn ${compact ? 'is-compact' : ''}`} onClick={turnOn} disabled={busy}>
        <Bell size={14} strokeWidth={1.5} /> {t.app.notify}
      </button>
      {msg && <span className="notify-msg" role="status">{msg}</span>}
    </>
  );
}
