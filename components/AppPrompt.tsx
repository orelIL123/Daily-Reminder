'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/client';
import { isIOS, isStandalone, registerServiceWorker } from '@/lib/push';
import NotifyButton from './NotifyButton';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
const SEEN_KEY = 'dr-app-prompt';
const SNOOZE_DAYS = 10;

/*
 * Suggests putting the store on the home screen.
 * Android / desktop Chrome: the browser's own install prompt. iPhone: a short "Share → Add to Home Screen" guide.
 * Inside the installed app: offers notifications instead. Shown once in a while, after the shopper has looked around.
 */
export default function AppPrompt() {
  const { t } = useI18n();
  const [mode, setMode] = useState<'android' | 'ios' | 'notify' | null>(null);
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null);

  useEffect(() => {
    registerServiceWorker();
    const snoozed = () => {
      try { const v = Number(localStorage.getItem(SEEN_KEY) || 0); return Date.now() - v < SNOOZE_DAYS * 864e5; } catch { return false; }
    };
    const onBip = (e: Event) => { e.preventDefault(); setInstallEvt(e as InstallEvent); };
    window.addEventListener('beforeinstallprompt', onBip);
    // the "turn on notifications" button on an iPhone outside the app opens the guide
    const onAsk = () => setMode(isIOS() ? 'ios' : 'android');
    window.addEventListener('dr-show-install', onAsk);

    const timer = window.setTimeout(() => {
      if (snoozed()) return;
      if (isStandalone()) {
        if ('Notification' in window && Notification.permission === 'default') setMode('notify');
      } else if (isIOS()) setMode('ios');
    }, 25000);
    return () => { window.clearTimeout(timer); window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('dr-show-install', onAsk); };
  }, []);

  // Android: show our card once the browser says the store can be installed
  useEffect(() => {
    if (!installEvt) return;
    let snoozed = false;
    try { snoozed = Date.now() - Number(localStorage.getItem(SEEN_KEY) || 0) < SNOOZE_DAYS * 864e5; } catch { /* ignore */ }
    if (snoozed) return;
    const timer = window.setTimeout(() => setMode(m => m ?? 'android'), 20000);
    return () => window.clearTimeout(timer);
  }, [installEvt]);

  function dismiss() {
    try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch { /* ignore */ }
    setMode(null);
  }
  async function install() {
    if (!installEvt) return;
    await installEvt.prompt();
    await installEvt.userChoice.catch(() => null);
    setInstallEvt(null);
    dismiss();
  }

  return (
    <AnimatePresence>
      {mode && (
        <motion.aside className="app-prompt" role="dialog" aria-label={t.app.installTitle}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}>
          <img src="/icons/icon-192.png" alt="" />
          <div>
            <h3>{mode === 'notify' ? t.app.notify : t.app.installTitle}</h3>
            <p>{t.app.installText}</p>
            {mode === 'ios' && (
              <p style={{ marginTop: 8 }}>
                <ShareIcon /> {t.app.iosSteps}<br />{t.app.iosPushNote}
              </p>
            )}
            <div className="app-actions">
              {mode === 'android' && installEvt && <button className="btn-primary" onClick={install}>{t.app.install}</button>}
              {mode === 'android' && !installEvt && <p>{t.app.androidSteps}</p>}
              {mode === 'notify' && <NotifyButton />}
              <button className="btn-outline" onClick={dismiss}>{t.app.notNow}</button>
            </div>
          </div>
          <button className="app-prompt-close" aria-label={t.app.close} onClick={dismiss}><X size={16} /></button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function ShareIcon() {
  return (
    <svg className="ios-share" width="15" height="17" viewBox="0 0 15 17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7.5 1v10M4 4.5L7.5 1 11 4.5M4.5 7H2.5A1.5 1.5 0 001 8.5v6A1.5 1.5 0 002.5 16h10a1.5 1.5 0 001.5-1.5v-6A1.5 1.5 0 0012.5 7h-2" />
    </svg>
  );
}
