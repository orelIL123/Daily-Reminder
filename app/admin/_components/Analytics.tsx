'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { ils } from '@/lib/admin/types';

type Totals = { visitors: number; sessions: number; page_views: number; bounced: number; funnel: number[]; orders: number; paid_orders: number; revenue: number };
type Day = { day: string; visitors: number; sessions: number; page_views: number; orders: number };
type Report = {
  live: number; first_event: string | null; totals: Totals; previous: Totals; daily: Day[];
  sources: { source: string; sessions: number; orders: number }[];
  devices: { device: string; sessions: number; orders: number }[];
  countries: { country: string; sessions: number }[];
  pages: { path: string; views: number; visitors: number }[];
  exits: { path: string; sessions: number }[];
  checkout_stops: { field: string; sessions: number }[];
  errors: { code: string; times: number }[];
  products: { id: string; name: string; views: number; carts: number; units: number }[];
};

const RANGES = [{ days: 1, label: 'היום' }, { days: 7, label: '7 ימים' }, { days: 30, label: '30 ימים' }, { days: 90, label: '90 ימים' }];
const STEPS = ['נכנסו לאתר', 'צפו במוצר', 'הוסיפו לסל', 'הגיעו לקופה', 'לחצו לתשלום', 'השלימו הזמנה'];
const FIELD: Record<string, string> = { '': 'נכנסו לקופה ולא מילאו שדה', name: 'שם מלא', email: 'אימייל', phone: 'טלפון', address: 'כתובת', city: 'עיר', zip: 'מיקוד', note: 'הערה להזמנה' };
const ERRORS: Record<string, string> = {
  out_of_stock: 'מידה אזלה מהמלאי', unavailable: 'פריט כבר לא זמין', invalid_email: 'אימייל לא תקין', missing_fields: 'שדות חסרים', missing_contact: 'פרטי קשר חסרים',
  invalid_discount: 'קוד הנחה לא תקף', not_configured: 'הקופה לא מוגדרת', network: 'תקלת תקשורת', generic: 'שגיאה כללית', catalogue: 'טעינת הקטלוג נכשלה',
};
const DEVICE: Record<string, string> = { mobile: 'נייד', desktop: 'מחשב', tablet: 'טאבלט', '': 'לא ידוע' };

const num = (n: number) => n.toLocaleString('he-IL');
const pct = (a: number, b: number) => (b ? `${(a / b * 100).toLocaleString('he-IL', { maximumFractionDigits: 1 })}%` : '—');
const dayLabel = (d: string) => `${Number(d.slice(8, 10))}.${Number(d.slice(5, 7))}`;
const pageName = (p: string) => (p === '/' ? 'עמוד הבית' : p === '/checkout' ? 'קופה' : p === '/account' ? 'החשבון שלי' : p);
const regions = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['he'], { type: 'region' }) : null;
const country = (c: string) => { try { return regions?.of(c) ?? c; } catch { return c; } };

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [r, setR] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    const { data, error } = await supabaseBrowser().rpc('analytics_report', { p_days: days });
    if (error) setError('טעינת הנתונים נכשלה.'); else { setR(data as Report); setError(''); }
    setLoading(false);
  }, [days]);
  useEffect(() => { load(); }, [load]);
  // keep the live counter fresh
  useEffect(() => {
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') load(true); }, 60000);
    return () => window.clearInterval(t);
  }, [load]);

  const t = r?.totals, p = r?.previous;
  const compare = days === 1 ? 'מול אתמול' : 'מול התקופה הקודמת';

  return (
    <>
      <div className="adm-head">
        <div><h1>נתונים</h1><p>{r ? <><span className="adm-live" /> {num(r.live)} באתר עכשיו</> : 'טוענים…'}</p></div>
        <div className="adm-head-actions"><button className="adm-icon" onClick={() => load()} aria-label="רענון"><RefreshCw size={16} className={loading ? 'spin' : ''} /></button></div>
      </div>
      <div className="adm-chips" role="group" aria-label="טווח זמן">
        {RANGES.map(x => <button key={x.days} className={days === x.days ? 'is-on' : ''} onClick={() => setDays(x.days)}>{x.label}</button>)}
      </div>
      {error && <p className="adm-error" role="alert">{error}</p>}
      {r && t && p && (
        <div className={loading ? 'adm-an is-loading' : 'adm-an'}>
          {!r.first_event && (
            <p className="adm-banner">עדיין אין ביקורים מתועדים. המדידה מתחילה כשהאתר המעודכן עולה לאוויר. ביקורים מהדפדפן שמחובר לניהול ומהמחשב המקומי לא נספרים.</p>
          )}
          <div className="adm-kpis">
            <Kpi label="מבקרים" value={num(t.visitors)} now={t.visitors} before={p.visitors} compare={compare} />
            <Kpi label="ביקורים" value={num(t.sessions)} now={t.sessions} before={p.sessions} compare={compare} />
            <Kpi label="צפיות בעמודים" value={num(t.page_views)} now={t.page_views} before={p.page_views} compare={compare} />
            <Kpi label="הזמנות" value={num(t.orders)} now={t.orders} before={p.orders} compare={compare} note={`${num(t.paid_orders)} שולמו`} />
            <Kpi label="מכירות (ששולמו)" value={ils(t.revenue)} now={Number(t.revenue)} before={Number(p.revenue)} compare={compare} />
            <Kpi label="שיעור המרה" value={pct(t.funnel?.[5] ?? 0, t.sessions)} now={t.sessions ? (t.funnel?.[5] ?? 0) / t.sessions : 0} before={p.sessions ? (p.funnel?.[5] ?? 0) / p.sessions : 0} compare={compare}
              note={`${pct(t.bounced, t.sessions)} עזבו אחרי עמוד אחד`} />
          </div>

          {days > 1 && <DailyChart data={r.daily} />}
          <Funnel steps={t.funnel ?? []} />

          <div className="adm-cols">
            <List title="איפה יצאו מהאתר" note="העמוד האחרון בביקורים שלא הסתיימו בהזמנה" rows={r.exits.map(x => ({ label: pageName(x.path), value: x.sessions }))} />
            <List title="איפה נעצרו בקופה" note="השדה האחרון שמולא לפני שעזבו בלי ללחוץ לתשלום" rows={r.checkout_stops.map(x => ({ label: x.field ? `אחרי "${FIELD[x.field] ?? x.field}"` : FIELD[''], value: x.sessions }))} />
            <List title="מאיפה הגיעו" rows={r.sources.map(x => ({ label: x.source || 'ישירות / לא ידוע', value: x.sessions, extra: x.orders ? `${num(x.orders)} הזמנות` : '' }))} />
            <List title="עמודים נצפים" rows={r.pages.map(x => ({ label: pageName(x.path), value: x.views, extra: `${num(x.visitors)} מבקרים` }))} />
            <List title="מכשירים" rows={r.devices.map(x => ({ label: DEVICE[x.device] ?? x.device, value: x.sessions, extra: pct(x.sessions, t.sessions) }))} />
            <List title="מדינות" rows={r.countries.map(x => ({ label: country(x.country), value: x.sessions }))} />
            {r.errors.length > 0 && <List title="שגיאות בקופה" rows={r.errors.map(x => ({ label: ERRORS[x.code] ?? x.code, value: x.times }))} />}
          </div>

          <section className="adm-box">
            <h3>מוצרים</h3>
            {r.products.length === 0 ? <p className="adm-note">אין נתונים בטווח הזה.</p> : (
              <div className="adm-table-wrap">
                <table className="adm-table adm-an-products">
                  <thead><tr><th>מוצר</th><th>ביקורים שצפו</th><th>הוסיפו לסל</th><th>יחידות שהוזמנו</th><th>מצפייה לסל</th></tr></thead>
                  <tbody>{r.products.map(x => <tr key={x.id}><td>{x.name}</td><td>{num(x.views)}</td><td>{num(x.carts)}</td><td>{num(x.units)}</td><td>{pct(x.carts, x.views)}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function Kpi({ label, value, now, before, compare, note }: { label: string; value: string; now: number; before: number; compare: string; note?: string }) {
  const change = before ? Math.round((now - before) / before * 100) : null;
  return (
    <div className="adm-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>
        {change === null ? 'אין נתוני השוואה' : <><b className={change > 0 ? 'up' : change < 0 ? 'down' : ''} dir="ltr">{change > 0 ? '▲ ' : change < 0 ? '▼ ' : ''}{Math.abs(change)}%</b> {compare}</>}
      </small>
      {note && <small>{note}</small>}
    </div>
  );
}

/** Visitors per day. Time runs right to left, like the rest of the Hebrew screen. */
function DailyChart({ data }: { data: Day[] }) {
  const [on, setOn] = useState<number | null>(null);
  const max = Math.max(1, ...data.map(d => d.visitors));
  const top = max <= 4 ? 4 : Math.ceil(max / 10 ** Math.floor(Math.log10(max))) * 10 ** Math.floor(Math.log10(max));
  const d = data[on ?? data.length - 1];
  const every = Math.ceil(data.length / 7);
  return (
    <section className="adm-box">
      <div className="adm-chart-head">
        <h3>מבקרים ביום</h3>
        {d && <p aria-live="polite"><b>{dayLabel(d.day)}</b> · {num(d.visitors)} מבקרים · {num(d.page_views)} צפיות · {num(d.orders)} הזמנות</p>}
      </div>
      <div className="adm-chart">
        <div className="adm-chart-y"><span>{num(top)}</span><span>{num(top / 2)}</span><span>0</span></div>
        <div className="adm-chart-bars" onMouseLeave={() => setOn(null)}>
          {data.map((x, i) => (
            <button key={x.day} className={on === i ? 'is-on' : ''} onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)} onClick={() => setOn(i)}
              aria-label={`${dayLabel(x.day)}: ${x.visitors} מבקרים`}>
              <i style={{ height: `${x.visitors / top * 100}%` }} />
              {(data.length - 1 - i) % every === 0 && <em>{dayLabel(x.day)}</em>}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Funnel({ steps }: { steps: number[] }) {
  const first = steps[0] || 0;
  const drops = steps.slice(1).map((n, i) => ({ i: i + 1, lost: steps[i] - n, rate: steps[i] ? (steps[i] - n) / steps[i] : 0 }));
  const worst = drops.filter(d => d.lost > 0).sort((a, b) => b.lost - a.lost)[0];
  return (
    <section className="adm-box">
      <h3>מסלול הקנייה — איפה נעצרים</h3>
      {!first ? <p className="adm-note">אין ביקורים בטווח הזה.</p> : (
        <>
          {worst && <p className="adm-note">הכי הרבה ביקורים נעצרים בין <b>&quot;{STEPS[worst.i - 1]}&quot;</b> ל<b>&quot;{STEPS[worst.i]}&quot;</b>: {num(worst.lost)} ({pct(worst.lost, steps[worst.i - 1])}).</p>}
          <ol className="adm-funnel">
            {STEPS.map((label, i) => (
              <li key={label} className={worst?.i === i ? 'is-worst' : ''}>
                <span>{label}</span>
                <div><i style={{ width: `${(steps[i] ?? 0) / first * 100}%` }} /></div>
                <b>{num(steps[i] ?? 0)}</b>
                <em>{pct(steps[i] ?? 0, first)}</em>
                <small>{i > 0 && steps[i - 1] > steps[i] ? `${num(steps[i - 1] - steps[i])} נעצרו לפני השלב` : ''}</small>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

function List({ title, note, rows }: { title: string; note?: string; rows: { label: string; value: number; extra?: string }[] }) {
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <section className="adm-box">
      <h3>{title}</h3>
      {note && <p className="adm-note">{note}</p>}
      {rows.length === 0 ? <p className="adm-note">אין נתונים בטווח הזה.</p> : (
        <ul className="adm-rank">
          {rows.map((r, i) => (
            <li key={`${r.label}${i}`}>
              <i style={{ width: `${r.value / max * 100}%` }} />
              <span><bdi>{r.label}</bdi>{r.extra && <small>{r.extra}</small>}</span>
              <b>{num(r.value)}</b>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
