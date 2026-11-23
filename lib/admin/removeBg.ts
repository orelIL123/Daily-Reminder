'use client';

/*
 * Automatic background removal for product photos on a plain, even background
 * (the usual AI "ghost mannequin on white" output, or a studio shot on a seamless sheet).
 *
 * 1. Read the background colour from the image border. If the border is not one even colour,
 *    give up (a real-world photo) and leave the image as it is.
 * 2. Flood-fill inwards from the border through every pixel close to that colour -> transparent.
 *    Comparing against the background colour (not the neighbour) keeps the fill out of the garment.
 * 3. Also clear closed pockets of background (e.g. the gap between an arm and the body),
 *    but only when the garment is clearly a different colour from the background.
 * 4. Soften a 2px edge band and remove the background tint from it, so no white halo is left.
 *
 * Runs fully in the browser, no external service.
 */

const HARD = 30;   // colour distance that still counts as background
const SOFT = 70;   // beyond this an edge pixel is fully opaque
const BORDER_OK = 0.72; // share of border pixels that must match the background colour

type Result = { removed: true; data: ImageData } | { removed: false; reason: 'already-transparent' | 'busy-background' };

export function removeBackground(img: ImageData): Result {
  const { data, width: w, height: h } = img;
  const n = w * h;

  // ---- 1. background colour from the border ring
  const ring: number[] = [];
  const step = Math.max(1, Math.floor((w + h) / 800));
  for (let x = 0; x < w; x += step) { ring.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y += step) { ring.push(y * w, y * w + w - 1); }
  let transparentEdge = 0;
  for (const i of ring) if (data[i * 4 + 3] < 200) transparentEdge++;
  if (transparentEdge > ring.length * 0.3) return { removed: false, reason: 'already-transparent' };

  const med = (k: number) => { const v = ring.map(i => data[i * 4 + k]).sort((a, b) => a - b); return v[v.length >> 1]; };
  const br = med(0), bgc = med(1), bb = med(2);
  const dist = (i: number) => { const p = i * 4, r = data[p] - br, g = data[p + 1] - bgc, b = data[p + 2] - bb; return Math.sqrt(r * r + g * g + b * b); };

  let match = 0;
  for (const i of ring) if (dist(i) < HARD) match++;
  if (match < ring.length * BORDER_OK) return { removed: false, reason: 'busy-background' };

  // ---- 2. flood fill from the border
  const bg = new Uint8Array(n);          // 1 = background
  const queue = new Int32Array(n);
  let head = 0, tail = 0;
  const seed = (i: number) => { if (!bg[i] && dist(i) < HARD) { bg[i] = 1; queue[tail++] = i; } };
  for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
  while (head < tail) {
    const i = queue[head++], x = i % w;
    if (x > 0) seed(i - 1);
    if (x < w - 1) seed(i + 1);
    if (i >= w) seed(i - w);
    if (i < n - w) seed(i + w);
  }

  // safety: if almost everything turned into background, the fill leaked into the garment
  let bgCount = 0;
  for (let i = 0; i < n; i++) bgCount += bg[i];
  if (bgCount > n * 0.97) return { removed: false, reason: 'busy-background' };

  // ---- 3. enclosed pockets, only if the garment is clearly not background-coloured
  const fg: number[] = [];
  for (let i = 0; i < n; i += 97) if (!bg[i]) fg.push(i);
  const fgMed = fg.length ? fg.map(dist).sort((a, b) => a - b)[fg.length >> 1] : 0;
  if (fgMed > 70) {
    const TIGHT = HARD * 0.6, MIN_AREA = Math.max(300, n * 0.0004);
    const seen = new Uint8Array(n);
    for (let s = 0; s < n; s++) {
      if (bg[s] || seen[s] || dist(s) >= TIGHT) continue;
      head = 0; tail = 0; queue[tail++] = s; seen[s] = 1;
      while (head < tail) {
        const i = queue[head++], x = i % w;
        const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i >= w ? i - w : -1, i < n - w ? i + w : -1];
        for (const j of nb) if (j >= 0 && !seen[j] && !bg[j] && dist(j) < TIGHT) { seen[j] = 1; queue[tail++] = j; }
      }
      if (tail >= MIN_AREA) for (let k = 0; k < tail; k++) bg[queue[k]] = 1;
    }
  }

  // ---- 4. write alpha, soften + de-tint a 2px edge band
  const out = new ImageData(new Uint8ClampedArray(data), w, h);
  const o = out.data;
  for (let i = 0; i < n; i++) if (bg[i]) o[i * 4 + 3] = 0;

  const nearBg = (i: number) => {
    const x = i % w, y = (i / w) | 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < w && yy < h && bg[yy * w + xx]) return true;
    }
    return false;
  };
  for (let i = 0; i < n; i++) {
    if (bg[i] || !nearBg(i)) continue;
    const d = dist(i);
    if (d >= SOFT) continue;
    const a = Math.max(0.15, Math.min(1, (d - HARD * 0.5) / (SOFT - HARD * 0.5)));
    const p = i * 4;
    // un-mix the background colour out of the edge pixel
    o[p] = (data[p] - br * (1 - a)) / a;
    o[p + 1] = (data[p + 1] - bgc * (1 - a)) / a;
    o[p + 2] = (data[p + 2] - bb * (1 - a)) / a;
    o[p + 3] = Math.round(data[p + 3] * a);
  }
  return { removed: true, data: out };
}
