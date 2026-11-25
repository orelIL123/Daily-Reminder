'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, CircleDashed, ExternalLink } from 'lucide-react';
import { loadSetting, saveSetting } from '@/lib/admin/settings';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { DEFAULT_SEO, defaultHomeDescription, defaultHomeTitle, normalizeSiteUrl, parseVerification, readSeo, type SeoSettings } from '@/lib/seo';
import SearchPreview from './SearchPreview';

type Health = { active: number; demo: number; noDescription: string[] };

export default function Seo() {
  const [s, setS] = useState<SeoSettings>(DEFAULT_SEO);
  const [saved, setSaved] = useState<SeoSettings | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    loadSetting('seo').then(v => { const r = readSeo(v); setS(r); setSaved(r); }).catch(() => setError('טעינת ההגדרות נכשלה.'));
    supabaseBrowser().from('products').select('slug, name_he, description_en, seo_description').eq('status', 'active')
      .then(({ data }) => {
        const rows = data ?? [];
        const real = rows.filter(p => !p.slug.startsWith('demo-'));
        setHealth({ active: real.length, demo: rows.length - real.length, noDescription: real.filter(p => !p.description_en?.trim() && !p.seo_description?.trim()).map(p => p.name_he) });
      });
  }, []);

  const set = <K extends keyof SeoSettings>(k: K, v: SeoSettings[K]) => { setS(x => ({ ...x, [k]: v })); setMsg(''); };
  const dirty = !!saved && JSON.stringify(saved) !== JSON.stringify(s);
  const base = normalizeSiteUrl(s.siteUrl) || origin;

  async function save() {
    setError(''); setMsg('');
    if (s.siteUrl.trim() && !normalizeSiteUrl(s.siteUrl)) return setError('כתובת הדומיין לא תקינה. לדוגמה: https://www.yourbrand.co.il');
    if (s.googleVerification.trim() && !parseVerification(s.googleVerification)) return setError('קוד האימות לא זוהה. הדביקו את כל תג ה־meta מגוגל, או רק את הערך שבתוך content.');
    if (s.indexable && !normalizeSiteUrl(s.siteUrl) && !window.confirm('עוד לא הוזן דומיין. להציג את האתר בגוגל בכתובת הזמנית?')) return;
    setBusy(true);
    try {
      const clean = readSeo(s);
      const now = await saveSetting('seo', clean);
      setS(clean); setSaved(clean);
      setMsg(now ? 'נשמר ופורסם.' : 'נשמר — יופיע באתר תוך דקה.');
    } catch { setError('השמירה נכשלה. נסו שוב.'); }
    setBusy(false);
  }

  const checks = [
    { ok: !!saved?.siteUrl, text: 'דומיין מקצועי מוגדר', hint: 'אחרי רכישה וחיבור ב־Vercel — מזינים אותו כאן.' },
    { ok: !!saved?.indexable, text: 'האתר פתוח למנועי חיפוש', hint: 'מדליקים את המתג כשהדומיין מחובר.' },
    { ok: !!saved?.googleVerification, text: 'קוד אימות של Search Console נשמר', hint: 'ראו את השלבים למטה.' },
    { ok: !!saved?.homeDescription, text: 'תיאור אישי לעמוד הבית', hint: 'משפט או שניים באנגלית: מה מוכרים ולמי.' },
    { ok: !!health && health.active > 0 && health.noDescription.length === 0, text: 'לכל מוצר יש תיאור באנגלית', hint: health?.noDescription.length ? `חסר ב: ${health.noDescription.slice(0, 5).join(', ')}` : 'עדיין אין מוצרים אמיתיים פעילים.' },
    { ok: !!health && health.demo === 0, text: 'אין מוצרי הדגמה באתר', hint: health?.demo ? `${health.demo} מוצרי הדגמה פעילים. הם מוסתרים מגוגל, אבל כדאי להעביר לארכיון לפני השקה.` : '' },
  ];

  return (
    <>
      <div className="adm-head">
        <div><h1>SEO וגוגל</h1><p>איך האתר מופיע בחיפוש ובשיתוף קישורים.</p></div>
        <div className="adm-head-actions"><button className="adm-btn adm-btn-dark" onClick={save} disabled={!dirty || busy}>{busy ? 'שומרים…' : 'שמירה ופרסום'}</button></div>
      </div>
      {error && <p className="adm-error" role="alert">{error}</p>}
      {msg && <p className="adm-ok" role="status"><Check size={15} /> {msg}</p>}
      {saved && !saved.indexable && <p className="adm-banner"><AlertTriangle size={16} /> האתר מוסתר כרגע מגוגל. זה נכון עד שמחברים דומיין — אחר כך מדליקים את &quot;הצגה בגוגל&quot;.</p>}

      <div className="adm-seo">
        <section className="adm-box">
          <h3>דומיין ונראות</h3>
          <div className="adm-form">
            <label className="span2">כתובת האתר (הדומיין)<input dir="ltr" value={s.siteUrl} onChange={e => set('siteUrl', e.target.value)} placeholder="https://www.yourbrand.co.il" /></label>
            <label className="span2 adm-switch"><input type="checkbox" checked={s.indexable} onChange={e => set('indexable', e.target.checked)} /><span>הצגה בגוגל ובמנועי חיפוש</span></label>
          </div>
        </section>

        <section className="adm-box">
          <h3>עמוד הבית</h3>
          <div className="adm-form">
            <label className="span2">כותרת בגוגל ({(s.homeTitle || defaultHomeTitle()).length}/60)<input dir="ltr" value={s.homeTitle} onChange={e => set('homeTitle', e.target.value)} placeholder={defaultHomeTitle()} /></label>
            <label className="span2">תיאור בגוגל ({(s.homeDescription || defaultHomeDescription()).length}/160)<textarea dir="ltr" rows={3} value={s.homeDescription} onChange={e => set('homeDescription', e.target.value)} placeholder={defaultHomeDescription()} /></label>
          </div>
          <SearchPreview url={base} title={s.homeTitle || defaultHomeTitle()} description={s.homeDescription || defaultHomeDescription()} />
        </section>

        <section className="adm-box">
          <h3>שיתוף ורשתות</h3>
          <div className="adm-form">
            <label className="span2">תמונה לשיתוף קישור (נתיב באתר או כתובת מלאה, מומלץ 1200×630)<input dir="ltr" value={s.ogImage} onChange={e => set('ogImage', e.target.value)} /></label>
            <label>קישור לאינסטגרם<input dir="ltr" value={s.instagram} onChange={e => set('instagram', e.target.value)} placeholder="https://instagram.com/…" /></label>
            <label>קישור לטיקטוק<input dir="ltr" value={s.tiktok} onChange={e => set('tiktok', e.target.value)} placeholder="https://tiktok.com/@…" /></label>
          </div>
        </section>

        <section className="adm-box">
          <h3>Google Search Console</h3>
          <ol className="adm-steps">
            <li>נכנסים ל־<a href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Search Console <ExternalLink size={12} /></a> עם חשבון הגוגל של החנות.</li>
            <li>מוסיפים נכס מסוג <b dir="ltr">URL prefix</b> עם כתובת הדומיין.</li>
            <li>בוחרים אימות בשיטת <b dir="ltr">HTML tag</b>, מעתיקים את התג, מדביקים כאן ושומרים.</li>
            <li>חוזרים לגוגל ולוחצים <b dir="ltr">Verify</b>.</li>
            <li>בתפריט <b dir="ltr">Sitemaps</b> מזינים <code dir="ltr">sitemap.xml</code> ושולחים.</li>
          </ol>
          <div className="adm-form">
            <label className="span2">קוד אימות<input dir="ltr" value={s.googleVerification} onChange={e => set('googleVerification', e.target.value)} placeholder='<meta name="google-site-verification" content="…" />' /></label>
          </div>
          <p className="adm-links">
            <a href="/sitemap.xml" target="_blank">sitemap.xml <ExternalLink size={12} /></a>
            <a href="/robots.txt" target="_blank">robots.txt <ExternalLink size={12} /></a>
          </p>
        </section>

        <section className="adm-box">
          <h3>מוכנות להשקה</h3>
          <ul className="adm-checks">
            {checks.map(c => (
              <li key={c.text} className={c.ok ? 'is-ok' : ''}>
                {c.ok ? <Check size={16} /> : <CircleDashed size={16} />}
                <div><b>{c.text}</b>{!c.ok && c.hint && <small>{c.hint}</small>}</div>
              </li>
            ))}
          </ul>
          <p className="adm-note">כותרת ותיאור לכל מוצר עורכים בתוך המוצר, בלשונית &quot;מוצרים&quot;.</p>
        </section>
      </div>
    </>
  );
}
