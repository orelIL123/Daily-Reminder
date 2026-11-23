"""
Turn transparent garment photos (front / side / back) into rail-ready images:
  - crop to the garment, scale all views of one product by the SAME factor
  - place the collar at a fixed height on a 360:455 canvas
  - draw a walnut-wood hanger neck behind the collar and a silver hook above it,
    so the piece hangs from the rail
Usage: python3 compose_garments.py <raw_dir> <out_dir>
  raw_dir holds <slug>-front.png, <slug>-side.png, <slug>-back.png
"""
import sys, pathlib
import numpy as np
from PIL import Image, ImageDraw

CW = 1122
CH = round(CW * 455 / 360)
TOP = int(CH * 0.085)          # collar line (matches the tee and HOOK_Y in Rail3D)
MAX_H = CH - TOP - 60
MAX_W = CW - 70
SS = 4                         # supersampling for the hook


def bbox(im):
    a = np.array(im)[..., 3]
    ys, xs = np.where(a > 24)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def neck_x(im, box, scale):
    """Centre of the topmost band of the garment = where the hook goes."""
    a = np.array(im)[..., 3]
    x0, y0, x1, y1 = box
    band = a[y0:y0 + max(6, int((y1 - y0) * 0.04)), x0:x1] > 24
    cols = np.where(band.any(axis=0))[0]
    return (x0 + (cols.min() + cols.max()) / 2) if len(cols) else (x0 + x1) / 2


# hanger palette — walnut wood neck + brushed-silver hook (keep in sync with lib/admin/compose.ts)
WOOD = ((58, 36, 22), (97, 64, 40), (140, 99, 65))      # edge, body, highlight (walnut)
SILVER = (142, 146, 152)
SILVER_HI = (232, 234, 238)
SILVER_LO = (98, 101, 107)


def wood_neck(canvas, hx):
    """Wooden hanger neck. Drawn BEHIND the garment, so only the part above the collar shows."""
    x0, x1 = hx - 23, hx + 23
    y0, y1 = TOP - 38, TOP + 16
    big = Image.new('L', (CW * SS, CH * SS), 0)
    d = ImageDraw.Draw(big)
    S = lambda x, y: (x * SS, y * SS)
    # a soft wedge: narrow at the top, wider where it meets the shoulders
    d.polygon([S(hx - 9, y0), S(hx + 9, y0), S(x1, y1), S(x0, y1)], fill=255)
    d.ellipse([S(hx - 9, y0 - 5), S(hx + 9, y0 + 5)], fill=255)
    mask = np.array(big.resize((CW, CH), Image.LANCZOS)).astype(float) / 255.0
    xs = np.arange(CW)[None, :].astype(float)
    # cylinder shading across the width, light from the upper left
    half = np.clip(((xs - hx) / 23.0), -1, 1)
    prof = np.clip(1 - np.abs(half + 0.28) ** 1.6, 0, 1)          # 0 at edges, 1 near the lit side
    edge, body, hi = [np.array(c, float) for c in WOOD]
    t = prof[..., None]
    col = np.where(t < 0.55, edge + (body - edge) * (t / 0.55), body + (hi - body) * ((t - 0.55) / 0.45))
    col = np.broadcast_to(col, (CH, CW, 3)).copy()
    # faint grain
    rng = np.random.default_rng(7)
    grain = rng.normal(0, 1, (CH, 1)).repeat(CW, axis=1)
    grain = np.convolve(grain[:, 0], np.ones(9) / 9, mode='same')[:, None] * 14
    col = np.clip(col + grain[..., None], 0, 255)
    layer = np.zeros((CH, CW, 4), np.uint8)
    layer[..., :3] = col.astype(np.uint8)
    layer[..., 3] = (mask * 255).astype(np.uint8)
    canvas.alpha_composite(Image.fromarray(layer, 'RGBA'))


def silver_hook(canvas, hx):
    """Silver metal hook + ferrule that reaches up to the rail. Drawn on top."""
    def stroke_layer(color, w, dx=0, dy=0):
        big = Image.new('RGBA', (CW * SS, CH * SS), (0, 0, 0, 0))
        d = ImageDraw.Draw(big)
        S = lambda x, y: ((x + dx) * SS, (y + dy) * SS)
        col = color + (255,)
        ww = int(w * SS)
        d.line([S(hx, TOP - 30), S(hx, TOP - 34 - 4)], fill=col, width=ww)
        d.arc([S(hx - 24, TOP - 92), S(hx + 24, TOP - 44)], start=200, end=440, fill=col, width=ww)
        d.line([S(hx - 1, TOP - 44), S(hx - 1, TOP - 30)], fill=col, width=ww)
        return big
    base = stroke_layer(SILVER, 7)
    shade = stroke_layer(SILVER_LO, 7, 0.9, 1.1)
    hi = stroke_layer(SILVER_HI, 2.4, -1.3, -1.3)
    out = Image.new('RGBA', base.size, (0, 0, 0, 0))
    out.alpha_composite(shade)
    out.alpha_composite(base)
    # keep the highlight inside the base stroke
    hi_a = np.minimum(np.array(hi)[..., 3], np.array(base)[..., 3])
    hi_arr = np.array(hi); hi_arr[..., 3] = (hi_a * 0.85).astype(np.uint8)
    out.alpha_composite(Image.fromarray(hi_arr, 'RGBA'))
    # ferrule: a small silver collar where metal meets wood
    d = ImageDraw.Draw(out)
    S = lambda x, y: (x * SS, y * SS)
    d.rounded_rectangle([S(hx - 12, TOP - 36), S(hx + 12, TOP - 24)], radius=5 * SS, fill=SILVER_LO + (255,))
    d.rounded_rectangle([S(hx - 12, TOP - 36), S(hx + 12, TOP - 26)], radius=5 * SS, fill=SILVER + (255,))
    d.rounded_rectangle([S(hx - 9, TOP - 35), S(hx + 2, TOP - 32)], radius=2 * SS, fill=SILVER_HI + (220,))
    canvas.alpha_composite(out.resize((CW, CH), Image.LANCZOS))


def compose(raw: pathlib.Path, out: pathlib.Path):
    out.mkdir(parents=True, exist_ok=True)
    slugs = sorted({p.name.rsplit('-', 1)[0] for p in raw.glob('*-front.png')})
    for slug in slugs:
        front = Image.open(raw / f'{slug}-front.png').convert('RGBA')
        fb = bbox(front)
        scale = min(MAX_H / (fb[3] - fb[1]), MAX_W / (fb[2] - fb[0]))
        for view in ('front', 'side', 'back'):
            src = raw / f'{slug}-{view}.png'
            if not src.exists():
                continue
            im = Image.open(src).convert('RGBA')
            b = bbox(im)
            s = min(scale, MAX_H / (b[3] - b[1]), MAX_W / (b[2] - b[0]))
            crop = im.crop(b)
            crop = crop.resize((round(crop.width * s), round(crop.height * s)), Image.LANCZOS)
            nx = (neck_x(im, b, s) - b[0]) * s
            ox = round(CW / 2 - nx)
            ox = max(10, min(CW - crop.width - 10, ox))
            canvas = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
            wood_neck(canvas, round(ox + nx))          # behind the garment
            canvas.alpha_composite(crop, (ox, TOP))
            silver_hook(canvas, round(ox + nx))        # on top
            canvas.save(out / f'{slug}-{view}.webp', quality=86, method=6)
            print(f'{slug}-{view}.webp', crop.size)


if __name__ == '__main__':
    compose(pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]))
