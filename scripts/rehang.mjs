/*
 * Redraw the hanger on rail-ready garment images that already carry the old hook.
 * Everything above the collar line is cleared, then the new neck (behind) and hook (on top) are drawn.
 * Usage: node --experimental-strip-types scripts/rehang.mjs <file.webp> [...more]
 * Needs @napi-rs/canvas (npm i -D @napi-rs/canvas).
 */
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFileSync, writeFileSync } from 'node:fs';
import { drawHangerNeck, drawHangerHook, HANGER_TOP } from '../lib/hanger.ts';

const TOP = HANGER_TOP;

for (const file of process.argv.slice(2)) {
  const img = await loadImage(readFileSync(file));
  const W = img.width, H = img.height;
  const src = createCanvas(W, H);
  const s = src.getContext('2d');
  s.drawImage(img, 0, 0);
  const data = s.getImageData(0, 0, W, H).data;

  // old ferrule sits at TOP-36..TOP-24: its centre is the hook x
  let x0 = W, x1 = 0;
  for (let y = TOP - 34; y < TOP - 28; y++) for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] > 120) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
  }
  const hx = x1 > x0 ? Math.round((x0 + x1) / 2) : Math.round(W / 2);

  // garment only: drop everything above the collar line
  s.clearRect(0, 0, W, TOP);
  const out = createCanvas(W, H);
  const g = out.getContext('2d');
  drawHangerNeck(g, hx);
  g.drawImage(src, 0, 0);
  drawHangerHook(g, hx);
  writeFileSync(file, await out.encode('webp', 88));
  console.log(file, 'hx', hx);
}
