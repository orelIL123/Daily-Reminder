'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, RefreshCw, Search } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { LOW_STOCK } from '@/lib/admin/types';

type Row = { id: string; size: string; color: string; sku: string | null; stock: number; sort_order: number; product: { id: string; name_he: string; status: string; sort_order: number; images: { view: string; url: string }[] } };
type Filter = 'all' | 'low' | 'out';

export default function Inventory() {
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, 'ok' | 'err' | 'busy'>>({});
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabaseBrowser()
      .from('product_variants')
      .select('id, size, color, sku, stock, sort_order, product:products!inner(id, name_he, status, sort_order, images:product_images(view, url))')
      .eq('is_active', true)
      .neq('product.status', 'archived');
    const list = ((data ?? []) as unknown as Row[]).sort((a, b) => a.product.sort_order - b.product.sort_order || a.sort_order - b.sort_order);
    setRows(list); setDraft({}); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => rows.filter(r =>
    (filter === 'all' || (filter === 'out' ? r.stock === 0 : r.stock > 0 && r.stock <= LOW_STOCK)) &&
    (!q || `${r.product.name_he} ${r.color} ${r.size} ${r.sku ?? ''}`.toLowerCase().includes(q.toLowerCase()))), [rows, filter, q]);
  const groups = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of shown) m.set(r.product.id, [...(m.get(r.product.id) ?? []), r]);
    return Array.from(m.values());
  }, [shown]);
  const outCount = rows.filter(r => r.stock === 0).length;
  const lowCount = rows.filter(r => r.stock > 0 && r.stock <= LOW_STOCK).length;

  async function commit(r: Row) {
    const raw = draft[r.id];
    if (raw === undefined) return;
    const value = Math.max(0, Math.floor(Number(raw)));
    if (!Number.isFinite(value) || value === r.stock) { setDraft(d => { const n = { ...d }; delete n[r.id]; return n; }); return; }
    setSaved(s => ({ ...s, [r.id]: 'busy' }));
    const { error } = await supabaseBrowser().from('product_variants').update({ stock: value }).eq('id', r.id);
    if (error) { setSaved(s => ({ ...s, [r.id]: 'err' })); return; }
    setRows(all => all.map(x => (x.id === r.id ? { ...x, stock: value } : x)));
    setDraft(d => { const n = { ...d }; delete n[r.id]; return n; });
    setSaved(s => ({ ...s, [r.id]: 'ok' }));
    setTimeout(() => setSaved(s => { const n = { ...s }; if (n[r.id] === 'ok') delete n[r.id]; return n; }), 1600);
  }

  return (
    <section>
      <header className="adm-head">
        <div><h1>מלאי</h1><p>עדכנו כמות ולחצו Enter או צאו מהשדה — השמירה מיידית.</p></div>
        <button className="adm-btn" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> רענון</button>
      </header>

      <div className="adm-toolbar">
        <div className="adm-chips">
          <button className={filter === 'all' ? 'is-on' : ''} onClick={() => setFilter('all')}>הכול ({rows.length})</button>
          <button className={filter === 'low' ? 'is-on' : ''} onClick={() => setFilter('low')}>מלאי נמוך ({lowCount})</button>
          <button className={filter === 'out' ? 'is-on' : ''} onClick={() => setFilter('out')}>אזל ({outCount})</button>
        </div>
        <label className="adm-search"><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש מוצר, צבע, מק״ט" /></label>
      </div>

      {!loading && groups.length === 0 && <div className="adm-empty">אין שורות להצגה.</div>}
      <div className="adm-inv">
        {groups.map(g => {
          const p = g[0].product;
          const img = p.images.find(i => i.view === 'front')?.url;
          return (
            <div key={p.id} className="adm-inv-group">
              <div className="adm-inv-head">{img && <img src={img} alt="" />}<b>{p.name_he}</b>{p.status === 'draft' && <span className="adm-pill p-draft">טיוטה</span>}</div>
              <table className="adm-table">
                <thead><tr><th>צבע</th><th>מידה</th><th>מק״ט</th><th>במלאי</th><th></th></tr></thead>
                <tbody>
                  {g.map(r => {
                    const v = draft[r.id] ?? String(r.stock);
                    const n = Number(v);
                    const state = n === 0 ? 'out' : n <= LOW_STOCK ? 'low' : '';
                    return (
                      <tr key={r.id} className={state ? `row-${state}` : ''}>
                        <td dir="ltr">{r.color}</td>
                        <td>{r.size}</td>
                        <td dir="ltr" className="muted">{r.sku}</td>
                        <td>
                          <input type="number" min="0" inputMode="numeric" className={`adm-qty ${state}`} value={v}
                            onChange={e => setDraft(d => ({ ...d, [r.id]: e.target.value }))}
                            onBlur={() => commit(r)} onKeyDown={e => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                            aria-label={`מלאי ${p.name_he} ${r.color} ${r.size}`} />
                        </td>
                        <td className="adm-inv-state">
                          {saved[r.id] === 'ok' && <span className="tx-ok"><Check size={14} /> נשמר</span>}
                          {saved[r.id] === 'err' && <span className="tx-out">שגיאה</span>}
                          {!saved[r.id] && state === 'out' && <span className="adm-badge-out sm">אזל</span>}
                          {!saved[r.id] && state === 'low' && <span className="tx-low">נמוך</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </section>
  );
}
