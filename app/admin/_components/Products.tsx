'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Sparkles } from 'lucide-react';
import { rehang } from '@/lib/admin/compose';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { LOW_STOCK, PRODUCT_STATUS_LABEL, ils, type Category, type ProductRow, type ProductStatus } from '@/lib/admin/types';
import ProductForm from './ProductForm';

export const PRODUCT_SELECT = 'id, slug, category_id, name_he, name_en, description_he, description_en, status, price, compare_at_price, sort_order, updated_at, seo_title, seo_description, images:product_images(id, product_id, view, url), variants:product_variants(id, product_id, size, color, sku, stock, sort_order, is_active)';

export default function Products() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<'all' | ProductStatus>('all');
  const [editing, setEditing] = useState<ProductRow | 'new' | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const db = supabaseBrowser();
    const [p, c] = await Promise.all([
      db.from('products').select(PRODUCT_SELECT).order('sort_order'),
      db.from('categories').select('id, slug, name_he, name_en').order('sort_order'),
    ]);
    setProducts((p.data ?? []) as ProductRow[]);
    setCategories((c.data ?? []) as Category[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  // one-off: redraw the new hanger on photos uploaded before the hanger was redesigned
  const [hangBusy, setHangBusy] = useState('');
  async function refreshHangers() {
    const list = products.flatMap(p => p.images.filter(i => i.url.includes('/storage/v1/object/public/product-images/') && !i.url.includes('-h2.webp')).map(i => ({ p, i })));
    if (!list.length) { window.alert('כל התמונות כבר עם הקולב החדש.'); return; }
    if (!window.confirm(`לעדכן את הקולב ב־${list.length} תמונות?`)) return;
    const db = supabaseBrowser();
    let done = 0, failed = 0;
    for (const { p, i } of list) {
      setHangBusy(`מעדכנים קולבים… ${done + failed + 1}/${list.length}`);
      try {
        const blob = await (await fetch(i.url, { cache: 'no-store' })).blob();
        const out = await rehang(blob);
        const path = `${p.id}/${i.view}-${Date.now()}-h2.webp`;
        const up = await db.storage.from('product-images').upload(path, out, { contentType: 'image/webp', cacheControl: '31536000' });
        if (up.error) throw up.error;
        const url = db.storage.from('product-images').getPublicUrl(path).data.publicUrl;
        const upd = await db.from('product_images').update({ url }).eq('id', i.id);
        if (upd.error) throw upd.error;
        const old = i.url.match(/\/product-images\/(.+)$/)?.[1];
        if (old) await db.storage.from('product-images').remove([old]);
        done++;
      } catch { failed++; }
    }
    setHangBusy('');
    window.alert(`עודכנו ${done} תמונות${failed ? `, ${failed} נכשלו` : ''}.`);
    load();
  }

  const shown = useMemo(() => products.filter(p => filter === 'all' || p.status === filter), [products, filter]);

  return (
    <section>
      <header className="adm-head">
        <div><h1>מוצרים</h1><p>{products.filter(p => p.status === 'active').length} פעילים באתר · {products.length} סה״כ</p></div>
        <div className="adm-head-actions">
          <button className="adm-btn" onClick={refreshHangers} disabled={!!hangBusy || loading} title="מצייר מחדש את הקולב על תמונות שהועלו לפני העיצוב החדש"><Sparkles size={15} /> {hangBusy || 'עדכון קולבים'}</button>
          <button className="adm-btn" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> רענון</button>
          <button className="adm-btn adm-btn-dark" onClick={() => setEditing('new')}><Plus size={16} /> מוצר חדש</button>
        </div>
      </header>

      <div className="adm-chips">
        {(['all', 'active', 'draft', 'archived'] as const).map(f => (
          <button key={f} className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>{f === 'all' ? 'הכול' : PRODUCT_STATUS_LABEL[f]}</button>
        ))}
      </div>

      <div className="adm-grid">
        {shown.map(p => {
          const live = p.variants.filter(v => v.is_active);
          const stock = live.reduce((s, v) => s + v.stock, 0);
          const out = live.length > 0 && stock === 0;
          const low = !out && live.some(v => v.stock > 0 && v.stock <= LOW_STOCK);
          const front = p.images.find(i => i.view === 'front')?.url;
          return (
            <button key={p.id} className={`adm-prod ${out ? 'is-out' : ''}`} onClick={() => setEditing(p)}>
              <div className="adm-prod-img">{front && <img src={front} alt="" />}{out && <span className="adm-badge-out">אזל</span>}</div>
              <div className="adm-prod-meta">
                <b>{p.name_he}</b>
                <small dir="ltr">{p.name_en}</small>
                <div className="adm-prod-row">
                  <span>{ils(p.price)}</span>
                  <span className={`adm-pill p-${p.status}`}>{PRODUCT_STATUS_LABEL[p.status]}</span>
                </div>
                <small className={out ? 'tx-out' : low ? 'tx-low' : ''}>{out ? 'אזל מהמלאי' : `${stock} יח׳ במלאי${low ? ' · מלאי נמוך' : ''}`}</small>
              </div>
            </button>
          );
        })}
      </div>

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          categories={categories}
          nextSort={Math.max(0, ...products.map(p => p.sort_order)) + 1}
          onClose={saved => { setEditing(null); if (saved) load(); }}
        />
      )}
    </section>
  );
}
