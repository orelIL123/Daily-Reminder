"""
Turn transparent garment photos (front / side / back) into rail-ready images:
  - crop to the garment, scale all views of one product by the SAME factor
  - place the collar at a fixed height on a 360:455 canvas
  - draw the hanger hook at the collar so the piece hangs from the rail
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


def hook(canvas, hx, hy):
    big = Image.new('RGBA', (CW * SS, CH * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    col, w = (96, 98, 100, 255), 7 * SS
    S = lambda x, y: (x * SS, y * SS)
    d.line([S(hx, hy), S(hx, hy - 34)], fill=col, width=w)
    d.arc([S(hx - 24, TOP - 92), S(hx + 24, TOP - 44)], start=200, end=440, fill=col, width=w)
    d.line([S(hx - 1, TOP - 44), S(hx - 1, hy - 30)], fill=col, width=w)
    d.rounded_rectangle([S(hx - 9, hy - 6), S(hx + 9, hy + 6)], radius=4 * SS, fill=(120, 122, 125, 255))
    canvas.alpha_composite(big.resize((CW, CH), Image.LANCZOS))


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
            canvas.alpha_composite(crop, (ox, TOP))
            hook(canvas, round(ox + nx), TOP + 6)
            canvas.save(out / f'{slug}-{view}.webp', quality=86, method=6)
            print(f'{slug}-{view}.webp', crop.size)


if __name__ == '__main__':
    compose(pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]))
