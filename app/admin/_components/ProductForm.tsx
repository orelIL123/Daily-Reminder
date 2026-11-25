'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { compose, prepare, scaleFor, type Prepared } from '@/lib/admin/compose';
import { publishNow } from '@/lib/admin/settings';
import { clip } from '@/lib/seo';
import { storeConfig } from '@/store.config';
import SearchPreview from './SearchPreview';
import { PRODUCT_STATUS_LABEL, VIEW_LABEL, type Category, type ProductRow, type ProductStatus, type View } from '@/lib/admin/types';

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const COLOR_SUGGESTIONS = ['White', 'Black', 'Navy', 'Cream', 'Gray', 'Stone', 'Forest'];
const VIEWS: View[] = ['front', 'side', 'back'];
const key = (color: string, size: string) => `${color}__${size}`;
const BUCKET = 'product-images';
/** Path inside the storage bucket for a public image URL, or null for images bundled with the site. */
const storagePath = (url?: string) => url?.match(/\/storage\/v1\/object\/public\/product-images\/(.+)$/)?.[1] ?? null;
const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || `item-${Date.now().toString(36)}`;

type Props = { product: ProductRow | null; categories: Category[]; nextSort: number; onClose: (saved: boolean) => void };

export default function ProductForm({ product, categories, nextSort, onClose }: Props) {
  const isNew = !product;
  const [f, setF] = useState({
    name_he: product?.name_he ?? '', name_en: product?.name_en ?? '',
    description_he: product?.description_he ?? '', description_en: product?.description_en ?? '',
    category_id: product?.category_id ?? categories[0]?.id ?? '',
    price: product ? String(product.price) : '', compare_at_price: product?.compare_at_price != null ? String(product.compare_at_price) : '',
    status: (product?.status ?? 'draft') as ProductStatus,
    seo_title: product?.seo_title ?? '', seo_description: product?.seo_description ?? '',
  });
  const live = product?.variants.filter(v => v.is_active) ?? [];
  const [sizes, setSizes] = useState<string[]>(product ? uniq(live.sort((a, b) => a.sort_order - b.sort_order).map(v => v.size)) : ['S', 'M', 'L', 'XL']);
  const [colors, setColors] = useState<string[]>(product ? uniq(live.map(v => v.color)) : ['White']);
  const [stock, setStock] = useState<Record<string, number>>(() => Object.fromEntries(live.map(v => [key(v.color, v.size), v.stock])));
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  // photos: current URLs from the DB, plus freshly prepared uploads
  const current = useMemo(() => Object.fromEntries((product?.images ?? []).map(i => [i.view, i.url])) as Partial<Record<View, string>>, [product]);
  const [prepared, setPrepared] = useState<Partial<Record<View, Prepared>>>({});
  const [composed, setComposed] = useState<Partial<Record<View, Blob>>>({});
  const [previews, setPreviews] = useState<Partial<Record<View, string>>>({});
  const [warn, setWarn] = useState<Partial<Record<View, string>>>({});
  const [info, setInfo] = useState<Partial<Record<View, string>>>({});
  const [removed, setRemoved] = useState<Partial<Record<View, boolean>>>({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF(s => ({ ...s, [k]: e.target.value }));

  // re-compose every uploaded view with the front's scale so the three views match in size
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const shared = prepared.front ? scaleFor(prepared.front) : undefined;
      const blobs: Partial<Record<View, Blob>> = {};
      for (const v of VIEWS) if (prepared[v]) blobs[v] = await compose(prepared[v]!, shared);
      if (cancelled) return;
      setComposed(blobs);
      setPreviews(old => {
        Object.values(old).forEach(u => u && URL.revokeObjectURL(u));
        return Object.fromEntries(Object.entries(blobs).map(([v, b]) => [v, URL.createObjectURL(b!)]));
      });
    })();
    return () => { cancelled = true; };
  }, [prepared]);

  async function pick(view: View, file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setWarn(w => ({ ...w, [view]: 'יש לבחור קובץ תמונה.' })); return; }
    if (file.size > 25 * 1024 * 1024) { setWarn(w => ({ ...w, [view]: 'הקובץ גדול מ־25MB.' })); return; }
    setWarn(w => ({ ...w, [view]: '' }));
    setInfo(m => ({ ...m, [view]: 'מעבדים את התמונה…' }));
    const p = await prepare(file);
    setWarn(w => ({ ...w, [view]: p.transparent || p.bgRemoved ? '' : 'לא הצלחנו להסיר את הרקע — הוא לא אחיד. צלמו/צרו את הבגד על רקע לבן או אפור חלק, או העלו PNG שקוף.' }));
    setInfo(m => ({ ...m, [view]: p.bgRemoved ? 'הרקע הוסר אוטומטית — בדקו בתצוגה.' : '' }));
    setPrepared(s => ({ ...s, [view]: p }));
    setRemoved(r => ({ ...r, [view]: false }));
  }

  /** Mark a photo for deletion (side / back). A just-picked photo is simply dropped. */
  function removePhoto(view: View) {
    if (prepared[view]) {
      setPrepared(s => { const n = { ...s }; delete n[view]; return n; });
      setInfo(m => ({ ...m, [view]: '' })); setWarn(w => ({ ...w, [view]: '' }));
      if (!current[view]) return;
    }
    setRemoved(r => ({ ...r, [view]: true }));
  }

  async function deleteProduct() {
    if (!product) return;
    if (!window.confirm(`למחוק לצמיתות את "${product.name_he}"?\n\nהמוצר, התמונות והמלאי יימחקו ולא ניתן יהיה לשחזר אותם. הזמנות קודמות יישמרו כמו שהן.\n(אם רק רוצים להוריד מהאתר — עדיף "העברה לארכיון".)`)) return;
    const db = supabaseBrowser();
    try {
      setBusy('מוחקים את התמונות…');
      const { data: files } = await db.storage.from(BUCKET).list(product.id, { limit: 100 });
      if (files?.length) await db.storage.from(BUCKET).remove(files.map(f => `${product.id}/${f.name}`));
      setBusy('מוחקים את המוצר…');
      const res = await db.from('products').delete().eq('id', product.id);
      if (res.error) throw res.error;
      setBusy('');
      void publishNow();
      onClose(true);
    } catch (e) {
      setBusy('');
      setError('המחיקה נכשלה: ' + ((e as { message?: string }).message ?? 'שגיאה לא ידועה'));
    }
  }

  function addSize() { const s = newSize.trim().toUpperCase(); if (s && !sizes.includes(s)) setSizes([...sizes, s]); setNewSize(''); }
  function addColor() { const c = newColor.trim(); if (c && !colors.includes(c)) setColors([...colors, c[0].toUpperCase() + c.slice(1)]); setNewColor(''); }
  const total = colors.reduce((s, c) => s + sizes.reduce((t, z) => t + (stock[key(c, z)] ?? 0), 0), 0);

  async function save() {
    setError('');
    if (!f.name_he.trim() || !f.name_en.trim()) return setError('נא למלא שם בעברית ובאנגלית.');
    const price = Number(f.price);
    if (!(price >= 0) || f.price === '') return setError('נא למלא מחיר תקין.');
    if (!current.front && !composed.front) return setError('חובה להעלות לפחות תמונת חזית.');
    if (!sizes.length || !colors.length) return setError('נא לבחור לפחות מידה אחת וצבע אחד.');

    const db = supabaseBrowser();
    try {
      setBusy('שומרים את פרטי המוצר…');
      const row = {
        name_he: f.name_he.trim(), name_en: f.name_en.trim(),
        description_he: f.description_he.trim(), description_en: f.description_en.trim(),
        category_id: f.category_id || null, price,
        compare_at_price: f.compare_at_price === '' ? null : Number(f.compare_at_price),
        status: f.status,
        seo_title: f.seo_title.trim(), seo_description: f.seo_description.trim(),
      };
      let id = product?.id;
      let slug = product?.slug;
      if (!id) {
        slug = slugify(row.name_en);
        let res = await db.from('products').insert({ ...row, slug, sort_order: nextSort }).select('id, slug').single();
        if (res.error?.code === '23505') { slug = `${slug}-${Date.now().toString(36).slice(-4)}`; res = await db.from('products').insert({ ...row, slug, sort_order: nextSort }).select('id, slug').single(); }
        if (res.error) throw res.error;
        id = res.data.id;
      } else {
        const res = await db.from('products').update(row).eq('id', id);
        if (res.error) throw res.error;
      }

      for (const v of VIEWS) {
        const blob = composed[v];
        if (!blob) continue;
        setBusy(`מעלים תמונת ${VIEW_LABEL[v]}…`);
        const path = `${id}/${v}-${Date.now()}-h2.webp`;
        const up = await db.storage.from('product-images').upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
        if (up.error) throw up.error;
        const url = db.storage.from('product-images').getPublicUrl(path).data.publicUrl;
        const del = await db.from('product_images').delete().eq('product_id', id).eq('view', v);
        if (del.error) throw del.error;
        const ins = await db.from('product_images').insert({ product_id: id, view: v, url, alt_he: row.name_he, alt_en: row.name_en });
        if (ins.error) throw ins.error;
        const old = storagePath(current[v]);
        if (old) await db.storage.from(BUCKET).remove([old]);
      }

      // photos the admin deleted
      for (const v of VIEWS) {
        if (!removed[v] || composed[v] || v === 'front') continue;
        setBusy(`מוחקים תמונת ${VIEW_LABEL[v]}…`);
        const del = await db.from('product_images').delete().eq('product_id', id).eq('view', v);
        if (del.error) throw del.error;
        const old = storagePath(current[v]);
        if (old) await db.storage.from(BUCKET).remove([old]);
      }

      setBusy('מעדכנים מלאי…');
      const existing = new Map((product?.variants ?? []).map(v => [key(v.color, v.size), v]));
      const skuBase = (slug ?? '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 24);
      let order = 0;
      for (const z of sizes) for (const c of colors) {
        order++;
        const k = key(c, z), qty = Math.max(0, Math.floor(stock[k] ?? 0));
        const ex = existing.get(k);
        const res = ex
          ? await db.from('product_variants').update({ stock: qty, is_active: true, sort_order: order }).eq('id', ex.id)
          : await db.from('product_variants').insert({ product_id: id, size: z, color: c, stock: qty, sort_order: order, sku: `${skuBase}-${c.toUpperCase().replace(/[^A-Z0-9]+/g, '')}-${z}` });
        if (res.error) throw res.error;
        existing.delete(k);
      }
      // sizes/colours removed from the product: hide them, keep them for order history
      for (const ex of Array.from(existing.values())) {
        if (!ex.is_active) continue;
        const res = await db.from('product_variants').update({ is_active: false }).eq('id', ex.id);
        if (res.error) throw res.error;
      }
      setBusy('');
      void publishNow();
      onClose(true);
    } catch (e) {
      setBusy('');
      setError('השמירה נכשלה: ' + ((e as { message?: string }).message ?? 'שגיאה לא ידועה'));
    }
  }

  return (
    <div className="adm-panel-backdrop" onClick={() => !busy && onClose(false)}>
      <aside className="adm-panel adm-panel-wide" onClick={e => e.stopPropagation()} role="dialog" aria-label={isNew ? 'מוצר חדש' : f.name_he}>
        <header>
          <div><h2>{isNew ? 'מוצר חדש' : f.name_he || 'עריכת מוצר'}</h2><small>{isNew ? 'ימולא ויישמר כטיוטה עד שתבחרו "פעיל באתר"' : product?.slug}</small></div>
          <button className="adm-icon" onClick={() => onClose(false)} aria-label="סגירה" disabled={!!busy}><X size={18} /></button>
        </header>

        <h3>תמונות</h3>
        <p className="adm-note">גררו או בחרו תמונה — PNG שקוף, או בגד על רקע לבן/אפור חלק (הרקע יוסר אוטומטית). האתר חותך, מיישר ומוסיף קולב — שלוש הזוויות יוצאות באותו גודל. תמונות צד וגב אפשר למחוק עם סמל הפח; את תמונת החזית מחליפים בגרירת תמונה חדשה.</p>
        <div className="adm-photos">
          {VIEWS.map(v => (
            <PhotoDrop key={v} label={VIEW_LABEL[v]} required={v === 'front'}
              src={previews[v] ?? (removed[v] ? undefined : current[v])} isNew={!!previews[v]} warn={warn[v]} info={removed[v] ? 'התמונה תימחק בשמירה' : info[v]}
              onPick={file => pick(v, file)}
              onRemove={v !== 'front' && (previews[v] || (current[v] && !removed[v])) ? () => removePhoto(v) : undefined} />
          ))}
        </div>

        <h3>פרטים</h3>
        <div className="adm-form">
          <label>שם בעברית<input value={f.name_he} onChange={set('name_he')} placeholder="ישתבח — חולצת ציצית" /></label>
          <label>שם באנגלית<input value={f.name_en} onChange={set('name_en')} dir="ltr" placeholder="Yishtabach — Tzitzit Tee" /></label>
          <label className="span2">תיאור בעברית<textarea rows={3} value={f.description_he} onChange={set('description_he')} /></label>
          <label className="span2">תיאור באנגלית<textarea rows={3} value={f.description_en} onChange={set('description_en')} dir="ltr" /></label>
          <label>קטגוריה<select value={f.category_id} onChange={set('category_id')}>{categories.map(c => <option key={c.id} value={c.id}>{c.name_he}</option>)}</select></label>
          <label>סטטוס
            <select value={f.status} onChange={set('status')}>{(['draft', 'active', 'archived'] as ProductStatus[]).map(s => <option key={s} value={s}>{PRODUCT_STATUS_LABEL[s]}</option>)}</select>
          </label>
          <label>מחיר (₪)<input type="number" min="0" step="1" inputMode="decimal" value={f.price} onChange={set('price')} dir="ltr" /></label>
          <label>מחיר לפני הנחה (לא חובה)<input type="number" min="0" step="1" inputMode="decimal" value={f.compare_at_price} onChange={set('compare_at_price')} dir="ltr" /></label>
        </div>

        <h3>איך המוצר מופיע בגוגל (לא חובה)</h3>
        <div className="adm-form">
          <label className="span2">כותרת באנגלית<input dir="ltr" value={f.seo_title} onChange={set('seo_title')} placeholder={`${f.name_en || 'Product name'} — ${storeConfig.brand.name}`} /></label>
          <label className="span2">תיאור קצר באנגלית, עד 160 תווים<textarea dir="ltr" rows={2} value={f.seo_description} onChange={set('seo_description')} placeholder={clip(f.description_en)} /></label>
        </div>
        <SearchPreview url={`/products/${product?.slug ?? slugify(f.name_en || 'product')}`}
          title={f.seo_title || `${f.name_en || 'Product name'} — ${storeConfig.brand.name}`}
          description={clip(f.seo_description || f.description_en || `${f.name_en} by ${storeConfig.brand.name}.`)} />

        <h3>מידות, צבעים ומלאי</h3>
        <div className="adm-tags">
          <span>מידות:</span>
          {SIZE_PRESETS.map(s => (
            <button key={s} className={sizes.includes(s) ? 'is-on' : ''} onClick={() => setSizes(sizes.includes(s) ? sizes.filter(x => x !== s) : SIZE_PRESETS.filter(x => x === s || sizes.includes(x)).concat(sizes.filter(x => !SIZE_PRESETS.includes(x))))}>{s}</button>
          ))}
          {sizes.filter(s => !SIZE_PRESETS.includes(s)).map(s => <button key={s} className="is-on" onClick={() => setSizes(sizes.filter(x => x !== s))}>{s} ×</button>)}
          <input value={newSize} onChange={e => setNewSize(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSize())} placeholder="מידה אחרת" dir="ltr" />
        </div>
        <div className="adm-tags">
          <span>צבעים:</span>
          {colors.map(c => <button key={c} className="is-on" onClick={() => setColors(colors.filter(x => x !== c))}>{c} ×</button>)}
          {COLOR_SUGGESTIONS.filter(c => !colors.includes(c)).slice(0, 4).map(c => <button key={c} onClick={() => setColors([...colors, c])}><Plus size={12} /> {c}</button>)}
          <input value={newColor} onChange={e => setNewColor(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColor())} placeholder="צבע (באנגלית)" dir="ltr" />
        </div>

        {sizes.length > 0 && colors.length > 0 && (
          <div className="adm-table-wrap">
            <table className="adm-table adm-stock">
              <thead><tr><th>צבע</th>{sizes.map(s => <th key={s}>{s}</th>)}</tr></thead>
              <tbody>
                {colors.map(c => (
                  <tr key={c}>
                    <td dir="ltr">{c}</td>
                    {sizes.map(z => {
                      const k = key(c, z), v = stock[k] ?? 0;
                      return <td key={z}><input type="number" min="0" inputMode="numeric" className={v === 0 ? 'is-zero' : ''} value={v} onChange={e => setStock(s => ({ ...s, [k]: Math.max(0, Number(e.target.value) || 0) }))} aria-label={`מלאי ${c} ${z}`} /></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="adm-note">סה״כ במלאי: <b>{total}</b> יח׳.{total === 0 && ' המוצר יוצג באתר באפור עם תווית "אזל".'}</p>

        {error && <p className="adm-error" role="alert">{error}</p>}
        <footer className="adm-panel-foot">
          {!isNew && <button className="adm-btn adm-btn-danger" disabled={!!busy} onClick={deleteProduct}><Trash2 size={15} /> מחיקה לצמיתות</button>}
          {!isNew && f.status !== 'archived' && <button className="adm-btn adm-btn-ghost" disabled={!!busy} onClick={() => setF(s => ({ ...s, status: 'archived' }))}>העברה לארכיון</button>}
          <span className="grow">{busy}</span>
          <button className="adm-btn" onClick={() => onClose(false)} disabled={!!busy}>ביטול</button>
          <button className="adm-btn adm-btn-dark" onClick={save} disabled={!!busy}>{busy ? 'שומרים…' : isNew ? 'יצירת מוצר' : 'שמירת שינויים'}</button>
        </footer>
      </aside>
    </div>
  );
}

function PhotoDrop({ label, required, src, isNew, warn, info, onPick, onRemove }: { label: string; required: boolean; src?: string; isNew: boolean; warn?: string; info?: string; onPick: (f: File | undefined) => void; onRemove?: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div className="adm-photo">
      <button type="button" className={`adm-drop ${over ? 'is-over' : ''}`} onClick={() => input.current?.click()}
        onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); onPick(e.dataTransfer.files?.[0]); }}>
        {src ? <img src={src} alt={label} /> : <span><ImagePlus size={22} /> גררו לכאן או לחצו</span>}
        {isNew && <em>חדש</em>}
      </button>
      {onRemove && <button type="button" className="adm-photo-del" onClick={onRemove} aria-label={`מחיקת תמונת ${label}`} title="מחיקת התמונה"><Trash2 size={14} /></button>}
      <span className="adm-photo-label">{label}{required && ' *'}</span>
      {warn && <span className="adm-warn"><AlertTriangle size={13} /> {warn}</span>}
      {info && !warn && <span className="adm-info"><Check size={13} /> {info}</span>}
      <input ref={input} type="file" accept="image/png,image/webp,image/jpeg,image/avif" hidden onChange={e => { onPick(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

function uniq<T>(xs: T[]) { return Array.from(new Set(xs)); }
