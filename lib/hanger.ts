/*
 * The hanger every garment hangs from on the rails: a polished-chrome hook with a rounded,
 * ball-tipped end and a wrapped collar, on a walnut-wood hanger neck.
 * Drawn on the 1122 × 1418 rail canvas. Shared by the admin uploader (lib/admin/compose.ts)
 * and scripts/rehang.mjs, which redraws the hanger on existing photos.
 * Plain canvas calls only, so it runs in the browser and in Node (@napi-rs/canvas).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ctx = any;

/** The garment's top edge (collar line) on the rail canvas. */
export const HANGER_TOP = 120;

/** Walnut neck. Drawn BEHIND the garment, so only the part above the collar shows. */
export function drawHangerNeck(g: Ctx, hx: number, top = HANGER_TOP) {
  const y0 = top - 40, y1 = top + 16;
  g.save();
  const grad = g.createLinearGradient(hx - 24, 0, hx + 24, 0);
  grad.addColorStop(0, '#3b2618');
  grad.addColorStop(0.2, '#6a462b');
  grad.addColorStop(0.42, '#9a7049');
  grad.addColorStop(0.7, '#6a462b');
  grad.addColorStop(1, '#3b2618');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(hx - 10, y0);
  g.quadraticCurveTo(hx - 12, top - 8, hx - 24, y1);
  g.lineTo(hx + 24, y1);
  g.quadraticCurveTo(hx + 12, top - 8, hx + 10, y0);
  g.closePath();
  g.fill();
  g.beginPath(); g.ellipse(hx, y0, 10, 4.5, 0, 0, Math.PI * 2); g.fill();
  g.restore();
}

function hookPath(g: Ctx, hx: number, top: number, dx = 0, dy = 0) {
  const x = hx + dx, y = top + dy;
  const cy = y - 80;              // centre of the loop (the rail runs through here)
  const r = 26, ry = 21;
  g.beginPath();
  g.moveTo(x, y - 46);                                        // out of the wrapped collar
  g.bezierCurveTo(x, y - 54, x + r, y - 60, x + r, cy);        // up the back of the hook
  g.ellipse(x, cy, r, ry, 0, 0, Math.PI, true);                // wide, flat loop over the rail
  g.bezierCurveTo(x - r, cy + 9, x - r + 2, cy + 15, x - r + 7, cy + 19); // down, tip turns slightly in
}

/** Chrome hook + wrapped collar + ball tip. Drawn ON TOP of the garment. */
export function drawHangerHook(g: Ctx, hx: number, top = HANGER_TOP) {
  const r = 26, cy = top - 80;
  const tipX = hx - r + 7, tipY = cy + 19;
  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  // soft shadow on the wall side
  g.lineWidth = 9; g.strokeStyle = 'rgba(0,0,0,.18)'; hookPath(g, hx, top, 1.6, 2.2); g.stroke();
  // body
  g.lineWidth = 9; g.strokeStyle = '#7d8189'; hookPath(g, hx, top); g.stroke();
  g.lineWidth = 6; g.strokeStyle = '#b4b8bf'; hookPath(g, hx, top, -0.6, -0.6); g.stroke();
  // specular line
  g.lineWidth = 1.8; g.strokeStyle = 'rgba(255,255,255,.92)'; hookPath(g, hx, top, -1.6, -1.6); g.stroke();

  // ball tip
  const bg = g.createRadialGradient(tipX - 2, tipY - 2, 0.5, tipX, tipY, 6.5);
  bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.45, '#b9bdc4'); bg.addColorStop(1, '#6c7078');
  g.fillStyle = bg;
  g.beginPath(); g.arc(tipX, tipY, 6.2, 0, Math.PI * 2); g.fill();

  // wrapped collar where the wire enters the wood: three tight rings
  for (let i = 0; i < 3; i++) {
    const y = top - 46 + i * 5;
    const cg = g.createLinearGradient(hx - 9, 0, hx + 9, 0);
    cg.addColorStop(0, '#6c7078'); cg.addColorStop(0.35, '#e9ebef'); cg.addColorStop(1, '#6c7078');
    g.fillStyle = cg;
    g.beginPath(); g.roundRect(hx - 8, y, 16, 5.2, 2.6); g.fill();
  }
  g.restore();
}
