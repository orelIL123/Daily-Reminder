'use client';
import { isSoldOut } from '@/lib/useProducts';

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  animate, motion, MotionValue, useMotionValue, useMotionValueEvent,
  useReducedMotion, useSpring, useTransform, useVelocity, type AnimationPlaybackControls,
} from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/products';
import { useI18n } from '@/lib/i18n/client';
import { imageFor } from '@/lib/views';
import { storeConfig, railBands } from '@/store.config';
import type { FlightOrigin } from '@/lib/flight';

/*
 * A curved, circular clothing rail rendered with CSS 3D.
 *
 *  - Every garment sits on a ring of radius R, facing outward. The ring rotates
 *    (the `offset` motion value, measured in "slots") so pieces glide around the curve.
 *  - Desktop: the camera sits BELOW the rail, so the rail bends down at both ends.
 *    Phone: the camera sits ABOVE the rail, so the rail curves up at both ends, and pieces
 *    hang in side view until the centred one is tapped (it turns to face you).
 *  - Drag velocity feeds a spring that swings the garments on their hooks.
 *  - Tap a piece → the rail turns until it is centred. Tap the centred piece → open the product
 *    (on a phone: first it turns to the front).
 *  - The silver rail itself is one smooth SVG shape traced from the real 3D geometry (no seams).
 */

const MIN_SLOTS = 12;          // repeat the collection so the ring never looks empty
const FADE_START = 56;         // degrees from front where pieces start fading
const FADE_END = 80;           // fully hidden beyond this angle
const RAIL_ARC = 86;           // how far the visible rail extends (degrees)
const RAIL_FADE_FROM = 60;     // the rail starts to fade out beyond this angle
const PROBE_STEP = 1.25;       // degrees between the invisible probes the rail is traced from
const HOOK_Y = 0.028;          // where the hanger hook sits in the image (fraction of height)
const IMAGE_RATIO = 455 / 360; // garment image height / width

type Geo = { R: number; step: number; gw: number; perspective: number; phone: boolean; origin: string };
function geoFor(w: number): Geo {
  if (w < 600) return { R: 400, step: 27, gw: 150, perspective: 800, phone: true, origin: '50% -260%' };
  if (w < 1000) return { R: 640, step: 21, gw: 210, perspective: 1200, phone: false, origin: '50% 92%' };
  return { R: 900, step: 18.5, gw: 262, perspective: 1600, phone: false, origin: '50% 92%' };
}

const mod = (n: number, m: number) => ((n % m) + m) % m;
/** shortest signed distance on a ring of n slots, in [-n/2, n/2) */
const ringDelta = (d: number, n: number) => mod(d + n / 2, n) - n / 2;
const fadeFor = (deg: number) => {
  const a = Math.abs(deg);
  if (a <= FADE_START) return 1;
  if (a >= FADE_END) return 0;
  return 1 - (a - FADE_START) / (FADE_END - FADE_START);
};

type BarPoint = { a: number; x: number; y: number; h: number };

type Props = {
  products: Product[];
  onActiveChange?: (index: number) => void;
  onOpen: (product: Product, origin?: FlightOrigin) => void;
  /** The piece that is currently flying into the product view (hidden on the rail meanwhile). */
  hiddenProductId?: string | null;
};

export default function Rail3D({ products, onActiveChange, onOpen, hiddenProductId }: Props) {
  const P = products.length;
  const S = P === 0 ? 0 : P * Math.max(1, Math.ceil(MIN_SLOTS / P));
  const reduceMotion = useReducedMotion();
  const { t, name } = useI18n();

  const [geo, setGeo] = useState<Geo>(() => geoFor(1440));
  useEffect(() => {
    const onResize = () => setGeo(geoFor(window.innerWidth));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const chord = 2 * geo.R * Math.sin((geo.step * Math.PI) / 360); // px between neighbours at the front
  const gh = geo.gw * IMAGE_RATIO;

  // ---- motion state -------------------------------------------------------
  const offset = useMotionValue(reduceMotion ? 0 : -3.4);
  const velocity = useVelocity(offset);
  const swingTarget = useTransform(velocity, v => Math.max(-16, Math.min(16, -v * 3.2)));
  const swing = useSpring(swingTarget, { stiffness: 90, damping: 5, mass: 0.9 });

  const anim = useRef<AnimationPlaybackControls | null>(null);
  const target = useRef(0);
  const [activeSlot, setActiveSlot] = useState(0);
  const [stage, setStage] = useState(0); // phone only: 0 = side view, 1 = turned to the front

  const settleTo = useCallback((slotTarget: number, velocityHint?: number) => {
    anim.current?.stop();
    target.current = slotTarget;
    anim.current = animate(offset, slotTarget, reduceMotion
      ? { duration: 0 }
      : { type: 'spring', stiffness: 120, damping: 22, mass: 1, velocity: velocityHint ?? offset.getVelocity() });
  }, [offset, reduceMotion]);

  // intro: the rail glides in on first paint
  useEffect(() => {
    if (!reduceMotion) anim.current = animate(offset, 0, { duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 });
    return () => anim.current?.stop();
  }, [offset, reduceMotion]);

  useMotionValueEvent(offset, 'change', o => {
    if (!S) return;
    const slot = mod(Math.round(o), S);
    if (slot !== activeSlot) {
      setActiveSlot(slot);
      setStage(0);
      onActiveChange?.(slot % P);
    }
  });

  const step = useCallback((dir: number) => settleTo(Math.round(target.current) + dir), [settleTo]);
  const goToSlot = useCallback((slot: number) => {
    const o = offset.get();
    settleTo(Math.round(o + ringDelta(slot - o, S)));
  }, [offset, settleTo, S]);
  const goToProduct = useCallback((index: number) => {
    const o = offset.get();
    let best = index, bestDist = Infinity;
    for (let s = index; s < S; s += P) {
      const d = Math.abs(ringDelta(s - o, S));
      if (d < bestDist) { bestDist = d; best = s; }
    }
    goToSlot(best);
  }, [offset, goToSlot, P, S]);

  // ---- tapping & dragging -------------------------------------------------
  // A tap is decided on pointer-up, using the piece that was under the finger at pointer-down, so it
  // still counts when the rail was moving or the finger wobbled a little.
  const drag = useRef<{ x: number; moved: number; id: number; captured: boolean; thr: number } | null>(null);
  const tapDown = useRef<{ slot: number; el: HTMLElement } | null>(null);
  const pointerTapped = useRef(false);
  const suppressClick = useRef(false);

  function onTap(slot: number, el: HTMLElement) {
    if (slot !== activeSlot) { goToSlot(slot); return; }
    // the rail may have been caught mid-glide: settle it dead-centre first
    const o = offset.get();
    if (Math.abs(o - Math.round(o)) > 0.02) settleTo(Math.round(o));
    if (geo.phone && stage === 0) { setStage(1); return; }          // phone: side view → front
    // open the blurred product view; the picture flies there from where it hangs
    const imgs = el.querySelectorAll('img');
    const img = imgs[imgs.length - 1];
    onOpen(products[slot % P], img ? { rect: img.getBoundingClientRect(), src: img.currentSrc || img.src } : undefined);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    anim.current?.stop();
    const thr = e.pointerType === 'mouse' ? 6 : 12;
    drag.current = { x: e.clientX, moved: 0, id: e.pointerId, captured: false, thr };
    const g = (e.target as HTMLElement).closest<HTMLElement>('[data-slot]');
    const el = g?.querySelector<HTMLElement>('.g3d-turn');
    tapDown.current = g && el ? { slot: Number(g.dataset.slot), el } : null;
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    d.x = e.clientX;
    d.moved += Math.abs(dx);
    if (d.moved <= d.thr) return;                       // still just a (wobbly) tap
    if (!d.captured) { d.captured = true; e.currentTarget.setPointerCapture(e.pointerId); }
    offset.set(offset.get() - dx / chord);
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const tap = tapDown.current;
    tapDown.current = null;
    if (d.moved > d.thr) {
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 60);
      const v = offset.getVelocity();
      const fling = Math.max(-5, Math.min(5, v * 0.28));
      settleTo(Math.round(offset.get() + fling), v);
    } else if (tap && e.type === 'pointerup') {
      pointerTapped.current = true;
      window.setTimeout(() => { pointerTapped.current = false; }, 400);
      onTap(tap.slot, tap.el);
    } else if (!anim.current || anim.current.state !== 'running') {
      settleTo(Math.round(offset.get()));
    }
  }

  // horizontal trackpad scrolling
  const wheelTimer = useRef<number | undefined>(undefined);
  function onWheel(e: React.WheelEvent) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    anim.current?.stop();
    offset.set(offset.get() + e.deltaX / chord / 1.4);
    window.clearTimeout(wheelTimer.current);
    wheelTimer.current = window.setTimeout(() => settleTo(Math.round(offset.get())), 120);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  }

  // ---- the silver rail: traced from invisible 3D probes, drawn as one smooth shape ----
  const probes = useMemo(() => {
    const out: number[] = [];
    for (let a = -RAIL_ARC; a <= RAIL_ARC + 0.01; a += PROBE_STEP) out.push(a);
    return out;
  }, []);
  const stageRef = useRef<HTMLDivElement>(null);
  const probeEls = useRef<(HTMLSpanElement | null)[]>([]);
  const [bar, setBar] = useState<BarPoint[] | null>(null);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !P) return;
    const measure = () => {
      const sr = stage.getBoundingClientRect();
      const pts: BarPoint[] = [];
      probes.forEach((a, i) => {
        const el = probeEls.current[i];
        if (!el) return;
        const r = el.getBoundingClientRect();
        pts.push({ a, x: r.left + r.width / 2 - (sr.left + sr.width / 2), y: r.top + r.height / 2 - sr.top, h: r.height });
      });
      setBar(pts);
    };
    measure();
  }, [geo, gh, probes, P]);

  if (!P) return null;
  const activeProduct = activeSlot % P;

  return (
    <div className="rail3d" dir="ltr">
      <div
        ref={stageRef}
        className="rail3d-stage"
        style={{ perspective: geo.perspective, perspectiveOrigin: geo.origin, height: gh + 70 }}
        role="region"
        aria-roledescription="carousel"
        aria-label={t.rail.region}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
      >
        {bar && <RailBar points={bar} finish={storeConfig.rail.finish} />}
        <div className="rail3d-ring" style={{ transform: `translateZ(${-geo.R}px)` }}>
          {probes.map((a, i) => (
            <span
              key={a}
              ref={el => { probeEls.current[i] = el; }}
              className="rail3d-probe"
              aria-hidden="true"
              style={{ transform: `rotateY(${a}deg) translateZ(${geo.R - 2}px)` }}
            />
          ))}
          {Array.from({ length: S }, (_, slot) => (
            <Garment
              key={slot}
              slot={slot}
              slots={S}
              product={products[slot % P]}
              geo={geo}
              gh={gh}
              offset={offset}
              swing={swing}
              isActive={slot === activeSlot}
              away={slot === activeSlot && hiddenProductId === products[slot % P].id}
              stage={slot === activeSlot ? stage : 0}
              onTap={onTap}
              onClickGuard={() => {
                if (pointerTapped.current) { pointerTapped.current = false; return true; }
                return suppressClick.current;
              }}
            />
          ))}
        </div>
      </div>

      <div className="rail3d-footer">
        <div className="rail3d-nav">
          <button aria-label={t.rail.prev} onClick={() => step(-1)}><ArrowLeft size={16} /></button>
          <div className="rail3d-dots" role="tablist" aria-label={t.rail.choose}>
            {products.map((p, i) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={i === activeProduct}
                aria-label={name(p)}
                className={i === activeProduct ? 'is-active' : ''}
                onClick={() => goToProduct(i)}
              />
            ))}
          </div>
          <button aria-label={t.rail.next} onClick={() => step(1)}><ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}

/** One continuous brushed-silver bar with a soft shadow, built from the measured projection of the 3D ring. */
function RailBar({ points, finish }: { points: BarPoint[]; finish: Parameters<typeof railBands>[0] }) {
  const id = useId().replace(/:/g, '');
  const bands = useMemo(() => railBands(finish, 14), [finish]);
  const n = points.length;
  if (n < 2) return null;
  const xe = Math.max(...points.map(p => Math.abs(p.x)));
  const yMin = Math.min(...points.map(p => p.y - p.h)) - 24;
  const yMax = Math.max(...points.map(p => p.y + p.h)) + 24;
  const W = 2 * xe + 80;
  const edge = (frac: number) => points.map(p => [p.x, p.y - p.h / 2 + p.h * frac] as const);
  const fadeX = (sign: 1 | -1) => {
    const q = points.filter(p => Math.sign(p.a) === sign && Math.abs(p.a) >= RAIL_FADE_FROM)[0] ?? points[sign > 0 ? n - 1 : 0];
    return q.x;
  };
  const fl = fadeX(-1), fr = fadeX(1);
  const pct = (x: number) => ((x + W / 2) / W) * 100;
  return (
    <svg
      className="rail3d-bar"
      width={W} height={yMax - yMin}
      viewBox={`${-W / 2} ${yMin} ${W} ${yMax - yMin}`}
      style={{ marginLeft: -W / 2, top: yMin }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-f`} gradientUnits="userSpaceOnUse" x1={-xe} y1="0" x2={xe} y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset={Math.max(0.01, (fl + xe) / (2 * xe))} stopColor="#fff" stopOpacity="1" />
          <stop offset={Math.min(0.99, (fr + xe) / (2 * xe))} stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-W / 2} y={yMin} width={W} height={yMax - yMin}>
          <rect x={-xe} y={yMin} width={2 * xe} height={yMax - yMin} fill={`url(#${id}-f)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-m)`}>
        {bands.map((color, k) => {
          const top = edge(k / bands.length);
          const bot = edge((k + 1) / bands.length).reverse().map(([x, y]) => [x, y + 0.6] as const);
          const d = `M${top.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}L${bot.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`;
          return <path key={k} d={d} fill={color} />;
        })}
      </g>
      
    </svg>
  );
}

type GarmentProps = {
  slot: number; slots: number; product: Product; geo: Geo; gh: number;
  offset: MotionValue<number>; swing: MotionValue<number>;
  isActive: boolean; away: boolean; stage: number;
  onTap: (slot: number, el: HTMLElement) => void;
  onClickGuard: () => boolean;
};

function Garment({ slot, slots, product, geo, gh, offset, swing, isActive, away, stage, onTap, onClickGuard }: GarmentProps) {
  const [canHover, setCanHover] = useState(false);
  useEffect(() => { setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches); }, []);
  const angle = useTransform(offset, o => ringDelta(slot - o, slots) * geo.step);
  const transform = useTransform(angle, a => `rotateY(${a}deg) translateZ(${geo.R}px)`);
  const opacity = useTransform(angle, fadeFor);
  const visibility = useTransform(opacity, o => (o < 0.01 ? 'hidden' : 'visible'));
  // glow strength follows how centred the piece is, so it fades smoothly with the glide
  // instead of switching on/off (and freezing half-way) when the piece becomes active
  const glow = useTransform(angle, a => Math.max(0, 1 - Math.abs(a) / (geo.step * 0.6)));
  // each piece swings a little differently, so the rail feels physical
  const k = 0.8 + ((slot * 37) % 10) / 22;
  const pieceSwing = useTransform(swing, s => s * k);
  // phone: side view first, turns to the front when the centred piece is tapped
  const faces = useMemo(() => {
    const front = imageFor(product, 'front');
    if (!geo.phone) return [imageFor(product, storeConfig.rail.curvedRestView)];
    const side = imageFor(product, 'side');
    return side === front ? [front] : [side, front];
  }, [product, geo.phone]);
  const { t, name, price } = useI18n();
  const label = name(product);
  const out = isSoldOut(product);

  return (
    <motion.div
      data-slot={slot}
      className={`g3d ${isActive ? 'is-active' : ''} ${out ? 'is-soldout' : ''}`}
      style={{ transform, visibility, width: geo.gw, marginLeft: -geo.gw / 2, top: -HOOK_Y * gh }}
    >
      <motion.div className={`g3d-swing ${away ? 'is-away' : ''}`} style={{ rotateZ: pieceSwing }}>
        <motion.button
          type="button"
          className="g3d-turn g3d-seq"
          style={{ height: gh, opacity }}
          whileHover={canHover ? { scale: 1.045 } : undefined}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          onClick={e => { if (!onClickGuard()) onTap(slot, e.currentTarget); }}
          aria-label={`${isActive ? t.rail.tapContinue(label) : t.rail.bringFront(label)}${out ? ` — ${t.product.soldOut}` : ''}`}
          tabIndex={isActive ? 0 : -1}
        >
          <motion.span className="g3d-glow-wrap" style={{ opacity: glow }} aria-hidden="true">
            <span className="g3d-glow" />
          </motion.span>
          {faces.map((src, i) => (
            <motion.img
              key={src}
              className="g3d-face g3d-flat"
              src={src}
              alt={i === faces.length - 1 && isActive ? label : ''}
              draggable={false}
              initial={false}
              animate={{ opacity: stage === i ? 1 : 0, rotateY: stage === i ? 0 : i > stage ? -65 : 65, scale: stage === i ? 1 : 0.94 }}
              transition={{ type: 'spring', stiffness: 110, damping: 17 }}
            />
          ))}
        </motion.button>
        {out && <motion.span className="soldout-tag" style={{ opacity }} aria-hidden="true">{t.product.soldOut}</motion.span>}
        {storeConfig.rail.showPriceTags && (
          <motion.span className="g3d-tag" style={{ opacity }} aria-hidden="true">
            <i />{price(product.price)}
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );
}
