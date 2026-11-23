'use client';

/*
 * Browser version of scripts/compose_garments.py.
 * Turns a garment photo into a rail-ready WebP (a plain white/grey background is removed automatically):
 * crop to the garment, scale (shared across a product's views), collar on a fixed line, walnut hanger neck + chrome hook (lib/hanger.ts).
 */

import { removeBackground } from './removeBg';
import { drawHangerNeck, drawHangerHook } from '@/lib/hanger';

export const CW = 1122;
export const CH = Math.round((CW * 455) / 360);
const TOP = Math.floor(CH * 0.085);
const MAX_H = CH - TOP - 60;
const MAX_W = CW - 70;
const ALPHA = 24;
const MAX_SIDE = 2400; // big phone photos are scaled down first; the rail canvas is only 1122px wide

export type Prepared = {
  bitmap: ImageBitmap; box: [number, number, number, number]; neckX: number;
  /** the photo arrived with a transparent background */
  transparent: boolean;
  /** a plain background was detected and removed here */
  bgRemoved: boolean;
};

export async function prepare(file: File): Promise<Prepared> {
  const source = await createImageBitmap(file);
  const k = Math.min(1, MAX_SIDE / Math.max(source.width, source.height));
  const W = Math.round(source.width * k), H = Math.round(source.height * k);
  const c = new OffscreenCanvas(W, H);
  const g = c.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(source, 0, 0, W, H);
  source.close();
  let img = g.getImageData(0, 0, W, H);

  // a photo with a solid background has opaque corners
  const corner = (x: number, y: number) => img.data[(y * W + x) * 4 + 3];
  const transparent = [corner(2, 2), corner(W - 3, 2), corner(2, H - 3), corner(W - 3, H - 3)].some(a => a < 200);

  // plain background (white / grey / any single colour) -> make it transparent
  let bgRemoved = false;
  if (!transparent) {
    const r = removeBackground(img);
    if (r.removed) { img = r.data; g.putImageData(img, 0, 0); bgRemoved = true; }
  }
  const bitmap = await createImageBitmap(c);
  const { data, width, height } = img;

  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (data[row + x * 4 + 3] > ALPHA) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (x1 <= x0 || y1 <= y0) { x0 = 0; y0 = 0; x1 = width - 1; y1 = height - 1; }

  // centre of the topmost band = collar / hood top, where the hook goes
  const band = Math.max(6, Math.floor((y1 - y0) * 0.04));
  let bx0 = x1, bx1 = x0;
  for (let y = y0; y < y0 + band; y++) for (let x = x0; x <= x1; x++) {
    if (data[(y * width + x) * 4 + 3] > ALPHA) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; }
  }
  const neckX = bx1 >= bx0 ? (bx0 + bx1) / 2 : (x0 + x1) / 2;
  return { bitmap, box: [x0, y0, x1 + 1, y1 + 1], neckX, transparent, bgRemoved };
}

export function scaleFor(p: Prepared) {
  const [x0, y0, x1, y1] = p.box;
  return Math.min(MAX_H / (y1 - y0), MAX_W / (x1 - x0));
}

/** Compose one view. Pass the front's scale so every view of a product has the same size. */
export async function compose(p: Prepared, sharedScale?: number): Promise<Blob> {
  const [x0, y0, x1, y1] = p.box;
  const s = Math.min(sharedScale ?? scaleFor(p), scaleFor(p));
  const w = Math.round((x1 - x0) * s), h = Math.round((y1 - y0) * s);
  const nx = (p.neckX - x0) * s;
  const ox = Math.max(10, Math.min(CW - w - 10, Math.round(CW / 2 - nx)));

  const out = new OffscreenCanvas(CW, CH);
  const g = out.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  drawHangerNeck(g, Math.round(ox + nx), TOP);            // behind the garment
  g.drawImage(p.bitmap, x0, y0, x1 - x0, y1 - y0, ox, TOP, w, h);
  drawHangerHook(g, Math.round(ox + nx), TOP);          // on top
  return out.convertToBlob({ type: 'image/webp', quality: 0.86 });
}

/** Redraw the hanger on an already rail-ready image (made with the old hook). Used by the admin "refresh hangers" tool. */
export async function rehang(blob: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(blob);
  const W = bmp.width, H = bmp.height;
  const src = new OffscreenCanvas(W, H);
  const s = src.getContext('2d')!;
  s.drawImage(bmp, 0, 0);
  bmp.close();
  const data = s.getImageData(0, 0, W, H).data;
  let x0 = W, x1 = 0;
  for (let y = TOP - 34; y < TOP - 28; y++) for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] > 120) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
  }
  const hx = x1 > x0 ? Math.round((x0 + x1) / 2) : Math.round(W / 2);
  s.clearRect(0, 0, W, TOP);
  const out = new OffscreenCanvas(W, H);
  const g = out.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  drawHangerNeck(g, hx, TOP);
  g.drawImage(src, 0, 0);
  drawHangerHook(g, hx, TOP);
  return out.convertToBlob({ type: 'image/webp', quality: 0.88 });
}
