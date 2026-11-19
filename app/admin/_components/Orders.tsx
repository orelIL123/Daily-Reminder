'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Mail, Phone, RefreshCw, X } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { STATUS_LABEL, ils, when, type OrderRow, type OrderStatus } from '@/lib/admin/types';

const FILTERS: { id: 'open' | 'all' | OrderStatus; label: string }[] = [
  { id: 'open', label: 'פתוחות' },
  { id: 'pending_payment', label: STATUS_LABEL.pending_payment },
  { id: 'paid', label: STATUS_LABEL.paid },
  { id: 'shipped', label: STATUS_LABEL.shipped },
  { id: 'cancelled', label: STATUS_LABEL.cancelled },
  { id: 'all', label: 'הכול' },
];
const OPEN: OrderStatus[] = ['pending_payment', 'paid', 'processing'];

// next steps offered for each status
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
};
const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  paid: 'סימון כשולם', processing: 'בהכנה', shipped: 'סימון כנשלח', delivered: 'נמסר ללקוח', cancelled: 'ביטול הזמנה',
};
const EVENT_LABEL: Record<string, string> = {
  created: 'ההזמנה נוצרה', paid: 'התשלום אושר', paid_after_expiry: 'שולם אחרי שפג תוקף השמירה',
  status_changed: 'שינוי סטטוס', cancelled: 'בוטלה (המלאי הוחזר)', reservation_expired: 'בוטלה — לא שולמה בזמן',
};

export default function Orders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('open');
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabaseBrowser()
      .from('orders')
      .select('*, order_items(*), order_events(id, type, data, created_at)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) setError('טעינת ההזמנות נכשלה.'); else setOrders((data ?? []) as OrderRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => orders.filter(o =>
    filter === 'all' ? true : filter === 'open' ? OPEN.includes(o.status) : o.status === filter), [orders, filter]);
  const counts = useMemo(() => ({
    open: orders.filter(o => OPEN.includes(o.status)).length,
    toShip: orders.filter(o => o.status === 'paid' || o.status === 'processing').length,
    revenue: orders.filter(o => !['pending_payment', 'cancelled', 'refunded'].includes(o.status)).reduce((s, o) => s + Number(o.total), 0),
  }), [orders]);
  const current = orders.find(o => o.id === openId) ?? null;

  return (
    <section>
      <header className="adm-head">
        <div><h1>הזמנות</h1><p>{orders.length} הזמנות במערכת</p></div>
        <button className="adm-btn" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> רענון</button>
      </header>

      <div className="adm-stats">
        <div><span>פתוחות</span><strong>{counts.open}</strong></div>
        <div><span>ממתינות למשלוח</span><strong>{counts.toShip}</strong></div>
        <div><span>סה״כ מכירות</span><strong>{ils(counts.revenue)}</strong></div>
      </div>

      <div className="adm-chips" role="tablist">
        {FILTERS.map(f => <button key={f.id} role="tab" aria-selected={filter === f.id} className={filter === f.id ? 'is-on' : ''} onClick={() => setFilter(f.id)}>{f.label}</button>)}
      </div>

      {error && <p className="adm-error">{error}</p>}
      {!loading && shown.length === 0 && <div className="adm-empty">אין הזמנות להצגה.</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>מס׳</th><th>תאריך</th><th>לקוח</th><th>עיר</th><th>פריטים</th><th>סכום</th><th>סטטוס</th></tr></thead>
          <tbody>
            {shown.map(o => (
              <tr key={o.id} onClick={() => setOpenId(o.id)} className={openId === o.id ? 'is-on' : ''}>
                <td className="num">#{o.order_number}</td>
                <td>{when(o.created_at)}</td>
                <td>{o.name}</td>
                <td>{o.shipping_address?.city ?? ''}</td>
                <td>{o.order_items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td className="num">{ils(o.total)}</td>
                <td><span className={`adm-status s-${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {current && <OrderPanel order={current} onClose={() => setOpenId(null)} onChanged={load} />}
    </section>
  );
}

function OrderPanel({ order, onClose, onChanged }: { order: OrderRow; onClose: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const a = order.shipping_address ?? {};

  async function move(to: OrderStatus) {
    if (to === 'cancelled' && !confirm(`לבטל את הזמנה #${order.order_number}? הפריטים יחזרו למלאי.`)) return;
    setBusy(true); setMsg('');
    const { error } = await supabaseBrowser().rpc('admin_set_order_status', { p_order_id: order.id, p_status: to, p_note: '' });
    setBusy(false);
    if (error) setMsg('העדכון נכשל: ' + error.message); else onChanged();
  }

  return (
    <div className="adm-panel-backdrop" onClick={onClose}>
      <aside className="adm-panel" onClick={e => e.stopPropagation()} role="dialog" aria-label={`הזמנה ${order.order_number}`}>
        <header>
          <div><h2>הזמנה #{order.order_number}</h2><small>{when(order.created_at)}</small></div>
          <span className={`adm-status s-${order.status}`}>{STATUS_LABEL[order.status]}</span>
          <button className="adm-icon" onClick={onClose} aria-label="סגירה"><X size={18} /></button>
        </header>

        {NEXT[order.status].length > 0 && (
          <div className="adm-actions">
            {NEXT[order.status].map(s => (
              <button key={s} className={`adm-btn ${s === 'cancelled' ? 'adm-btn-danger' : 'adm-btn-dark'}`} disabled={busy} onClick={() => move(s)}>{ACTION_LABEL[s]}</button>
            ))}
          </div>
        )}
        {order.status === 'pending_payment' && order.reserved_until && (
          <p className="adm-note">המלאי שמור עד {when(order.reserved_until)}. אם לא ישולם עד אז, ההזמנה תבוטל אוטומטית.</p>
        )}
        {msg && <p className="adm-error">{msg}</p>}

        <h3>לקוח</h3>
        <div className="adm-kv">
          <div><span>שם</span><b>{order.name}</b></div>
          <div><span>טלפון</span><a href={`tel:${order.phone}`} dir="ltr"><Phone size={13} /> {order.phone}</a></div>
          <div><span>אימייל</span><a href={`mailto:${order.email}`} dir="ltr"><Mail size={13} /> {order.email}</a></div>
          <div><span>כתובת</span><b>{[a.street, a.city, a.zip].filter(Boolean).join(', ')}</b></div>
          {order.customer_note && <div><span>הערת לקוח</span><b>{order.customer_note}</b></div>}
        </div>

        <h3>פריטים</h3>
        <ul className="adm-items">
          {order.order_items.map(i => (
            <li key={i.id}><div><b>{i.name}</b><small>{i.color} · {i.size}{i.sku ? ` · ${i.sku}` : ''}</small></div><span>×{i.quantity}</span><span className="num">{ils(i.line_total)}</span></li>
          ))}
        </ul>
        <div className="adm-totals">
          <div><span>סכום ביניים</span><span>{ils(order.subtotal)}</span></div>
          {Number(order.discount_total) > 0 && <div><span>הנחה {order.discount_code ? `(${order.discount_code})` : ''}</span><span>−{ils(order.discount_total)}</span></div>}
          <div><span>משלוח</span><span>{Number(order.shipping_total) ? ils(order.shipping_total) : 'חינם'}</span></div>
          <div className="total"><span>סה״כ</span><span>{ils(order.total)}</span></div>
        </div>

        <h3>היסטוריה</h3>
        <ol className="adm-history">
          {[...(order.order_events ?? [])].sort((x, y) => x.id - y.id).map(e => (
            <li key={e.id}>
              <span>{when(e.created_at)}</span>
              <b>{e.type === 'status_changed' && typeof e.data?.to === 'string' ? `${STATUS_LABEL[e.data.to as OrderStatus]}` : EVENT_LABEL[e.type] ?? e.type}</b>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
