'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { storeConfig } from '@/store.config';

export default function Login() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError('');
    const f = new FormData(e.currentTarget);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: String(f.get('email')), password: String(f.get('password')) });
    if (error) setError(error.message === 'Invalid login credentials' ? 'אימייל או סיסמה שגויים.' : 'ההתחברות נכשלה. נסו שוב.');
    setBusy(false);
  }

  return (
    <div className="adm-gate">
      <form className="adm-card" onSubmit={submit}>
        <div className="adm-brand">{storeConfig.brand.name}<span>ניהול</span></div>
        <h1>כניסה לניהול החנות</h1>
        <label>אימייל<input name="email" type="email" autoComplete="username" dir="ltr" required /></label>
        <label>סיסמה<input name="password" type="password" autoComplete="current-password" dir="ltr" required /></label>
        {error && <p className="adm-error" role="alert">{error}</p>}
        <button className="adm-btn adm-btn-dark" disabled={busy}>{busy ? 'מתחברים…' : 'כניסה'}</button>
      </form>
    </div>
  );
}
