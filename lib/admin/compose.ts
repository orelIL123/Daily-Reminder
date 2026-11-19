'use client';

/*
 * Browser version of scripts/compose_garments.py.
 * Turns a transparent garment photo into a rail-ready WebP:
 * crop to the garment, scale (shared across a product's views), collar on a fixed line, hanger hook on top.
 */

export const CW = 1122;
export const CH = Math.round((CW * 455) / 360);
const TOP = Math.floor(CH * 0.085);
const MAX_H = CH - TOP - 60;
const MAX_W = CW - 70;
const ALPHA = 24;

export type Prepared = { bitmap: ImageBitmap; box: [number, number, number, number]; neckX: number; transparent: boolean };

export async function prepare(file: File): Promise<Prepared> {
  const bitmap = await createImageBitmap(file);
  const c = new OffscreenCanvas(bitmap.width, bitmap.height);
  const g = c.getContext('2d')!;
  g.drawImage(bitmap, 0, 0);
  const { data, width, height } = g.getImageData(0, 0, bitmap.width, bitmap.height);

  // a photo with a solid background has opaque corners
  const corner = (x: number, y: number) => data[(y * width + x) * 4 + 3];
  const transparent = [corner(2, 2), corner(width - 3, 2), corner(2, height - 3), corner(width - 3, height - 3)].some(a => a < 200);

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
  return { bitmap, box: [x0, y0, x1 + 1, y1 + 1], neckX, transparent };
}

export function scaleFor(p: Prepared) {
  const [x0, y0, x1, y1] = p.box;
  return Math.min(MAX_H / (y1 - y0), MAX_W / (x1 - x0));
}

function drawHook(g: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, hx: number, hy: number) {
  g.save();
  g.strokeStyle = '#606264'; g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx, hy - 34); g.stroke();
  g.beginPath(); g.arc(hx, TOP - 68, 24, (200 * Math.PI) / 180, (440 * Math.PI) / 180); g.stroke();
  g.beginPath(); g.moveTo(hx - 1, TOP - 44); g.lineTo(hx - 1, hy - 30); g.stroke();
  g.fillStyle = '#787a7d';
  g.beginPath(); g.roundRect(hx - 9, hy - 6, 18, 12, 4); g.fill();
  g.restore();
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
  g.drawImage(p.bitmap, x0, y0, x1 - x0, y1 - y0, ox, TOP, w, h);
  drawHook(g, Math.round(ox + nx), TOP + 6);
  return out.convertToBlob({ type: 'image/webp', quality: 0.86 });
}
