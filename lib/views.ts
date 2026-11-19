import type { Product } from './products';
import type { GarmentView } from '@/store.config';

/** Best image for a view, falling back gracefully when a product lacks that photo. */
export function imageFor(p: Product, view: GarmentView): string {
  if (view === 'side') return p.sideImage || p.frontImage;
  if (view === 'back') return p.backImage || p.sideImage || p.frontImage;
  return p.frontImage;
}

const ORDER: Record<GarmentView, GarmentView[]> = {
  front: ['front', 'side', 'back'],
  side: ['side', 'front', 'back'],
  back: ['back', 'side', 'front'],
};

/** Images a shopper steps through by tapping, starting from the rest view. Duplicates removed. */
export function viewSequence(p: Product, rest: GarmentView): string[] {
  const out: string[] = [];
  for (const v of ORDER[rest]) {
    const has = v === 'front' || (v === 'side' && p.sideImage) || (v === 'back' && p.backImage);
    const img = imageFor(p, v);
    if (has && !out.includes(img)) out.push(img);
  }
  return out;
}
