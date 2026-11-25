'use client';

import { useEffect, useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { loadSetting, saveSetting } from '@/lib/admin/settings';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { BODY_FONTS, DEFAULT_THEME, DISPLAY_FONTS, FONT_PAIRS, readTheme, themeVars, type BodyFontId, type DisplayFontId, type Theme } from '@/lib/theme';
import { storeConfig } from '@/store.config';
import { formatPrice } from '@/lib/money';

type Sample = { name: string; price: number; image: string };

export default function Design() {
  const [saved, setSaved] = useState<Theme | null>(null);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [sample, setSample] = useState<Sample>({ name: 'Yishtabach — Tzitzit Tee', price: 249, image: '/products/tee-front.webp' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSetting('theme').then(v => { const t = readTheme(v); setSaved(t); setTheme(t); })
      .catch(() => setError('טעינת ההגדרות נכשלה.'));
    // preview with a real product from the store
    supabaseBrowser().from('products').select('name_en, price, images:product_images(view, url)').eq('status', 'active').order('sort_order').limit(1)
      .then(({ data }) => {
        const p = data?.[0] as { name_en: string; price: number; images: { view: string; url: string }[] } | undefined;
        const image = p?.images.find(i => i.view === 'front')?.url;
        if (p && image) setSample({ name: p.name_en, price: Number(p.price), image });
      });
  }, []);

  const dirty = !!saved && (saved.display !== theme.display || saved.body !== theme.body);
  const pick = (t: Theme) => { setTheme(t); setMsg(''); };

  async function save() {
    setBusy(true); setError(''); setMsg('');
    try {
      const now = await saveSetting('theme', theme);
      setSaved(theme);
      setMsg(now ? 'נשמר — הגופנים כבר באתר (רעננו את העמוד).' : 'נשמר — יופיע באתר תוך דקה.');
    } catch { setError('השמירה נכשלה. נסו שוב.'); }
    setBusy(false);
  }

  return (
    <>
      <div className="adm-head">
        <div><h1>עיצוב</h1><p>הגופנים של האתר. בוחרים שילוב מוכן, או מרכיבים לבד.</p></div>
        <div className="adm-head-actions">
          {dirty && <button className="adm-btn" onClick={() => pick(saved!)}>ביטול</button>}
          <button className="adm-btn adm-btn-dark" onClick={save} disabled={!dirty || busy}>{busy ? 'שומרים…' : 'שמירה ופרסום'}</button>
        </div>
      </div>
      {error && <p className="adm-error" role="alert">{error}</p>}
      {msg && <p className="adm-ok" role="status"><Check size={15} /> {msg}</p>}

      <div className="adm-design">
        <div>
          <h3 className="adm-h3">שילובים מוכנים</h3>
          <div className="adm-pairs">
            {FONT_PAIRS.map(p => {
              const on = p.display === theme.display && p.body === theme.body;
              return (
                <button key={p.id} className={on ? 'is-on' : ''} aria-pressed={on} onClick={() => pick({ display: p.display, body: p.body })} dir="ltr">
                  <strong style={{ fontFamily: DISPLAY_FONTS[p.display].stack }}>{storeConfig.brand.name}</strong>
                  <span style={{ fontFamily: BODY_FONTS[p.body].stack }}>New collection · {formatPrice(sample.price)}</span>
                  <small>{DISPLAY_FONTS[p.display].name} + {BODY_FONTS[p.body].name}</small>
                  {on && <i><Check size={13} /></i>}
                </button>
              );
            })}
          </div>

          <h3 className="adm-h3">הרכבה אישית</h3>
          <div className="adm-form">
            <label>גופן לכותרות, שמות מוצרים ולוגו
              <select value={theme.display} onChange={e => pick({ ...theme, display: e.target.value as DisplayFontId })}>
                {Object.entries(DISPLAY_FONTS).map(([id, f]) => <option key={id} value={id}>{f.name} — {f.note}</option>)}
              </select>
            </label>
            <label>גופן לטקסט, תפריטים וכפתורים
              <select value={theme.body} onChange={e => pick({ ...theme, body: e.target.value as BodyFontId })}>
                {Object.entries(BODY_FONTS).map(([id, f]) => <option key={id} value={id}>{f.name} — {f.note}</option>)}
              </select>
            </label>
          </div>
          <p className="adm-note">הגופנים באנגלית וחלים על החנות. מסך הניהול ועמודי המידע בעברית נשארים בגופן העברי.</p>
        </div>

        <div className="adm-preview" dir="ltr" style={themeVars(theme) as React.CSSProperties} aria-label="תצוגה מקדימה">
          <header><span>NEW IN</span><b>{storeConfig.brand.name}<i>.</i></b><ShoppingBag size={16} strokeWidth={1.5} /></header>
          <img src={sample.image} alt="" />
          <h4>{sample.name}</h4>
          <p>{formatPrice(sample.price)}</p>
          <h5>The collection</h5>
          <p className="adm-preview-text">{storeConfig.editorial.text}</p>
          <div className="adm-preview-sizes">{['S', 'M', 'L', 'XL'].map(s => <span key={s} className={s === 'M' ? 'is-on' : ''}>{s}</span>)}</div>
          <div className="adm-preview-cta">ADD TO BAG</div>
        </div>
      </div>
    </>
  );
}
