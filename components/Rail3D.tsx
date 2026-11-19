'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  animate, motion, MotionValue, useMotionValue, useMotionValueEvent,
  useReducedMotion, useSpring, useTransform, useVelocity, type AnimationPlaybackControls,
} from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/products';
import { formatPrice } from '@/lib/money';
import { viewSequence } from '@/lib/views';
import { storeConfig } from '@/store.config';

/*
 * A curved, circular clothing rail rendered with CSS 3D.
 *
 *  - Every garment sits on a ring of radius R, facing outward. The ring rotates
 *    (the `offset` motion value, measured in "slots") so pieces glide around the curve.
 *  - The camera sits BELOW the rail (perspective-origin is low), so the rail bends
 *    down at both ends — like looking up at a real shop rail.
 *  - Drag velocity feeds a spring that swings the garments on their hooks.
 *  - Tap the centred piece → it turns to show its back. Tap again → open product.
 */

const MIN_SLOTS = 12;          // repeat the collection so the ring never looks empty
const FADE_START = 56;         // degrees from front where pieces start fading
const FADE_END = 80;           // fully hidden beyond this angle
const RAIL_ARC = 86;           // how far the visible rail extends (degrees)
const HOOK_Y = 0.028;          // where the hanger hook sits in the image (fraction of height)
const IMAGE_RATIO = 455 / 360; // garment image height / width

type Geo = { R: number; step: number; gw: number; perspective: number };
function geoFor(w: number): Geo {
  if (w < 600) return { R: 400, step: 27, gw: 156, perspective: 800 };
  if (w < 1000) return { R: 640, step: 21, gw: 210, perspective: 1200 };
  return { R: 900, step: 18.5, gw: 262, perspective: 1600 };
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

const viewsOf = (p: Product) => viewSequence(p, storeConfig.rail.curvedRestView);

type Props = {
  products: Product[];
  onActiveChange?: (index: number) => void;
  onOpen: (product: Product) => void;
};

export default function Rail3D({ products, onActiveChange, onOpen }: Props) {
  const P = products.length;
  const S = P === 0 ? 0 : P * Math.max(1, Math.ceil(MIN_SLOTS / P));
  const reduceMotion = useReducedMotion();

  const [geo, setGeo] = useState<Geo>(() => geoFor(1440));
  useEffect(() => {
    const onResize = () => setGeo(geoFor(window.innerWidth));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const chord = 2 * geo.R * Math.sin((geo.step * Math.PI) / 360); // px between neighbours at the front

  // ---- motion state -------------------------------------------------------
  const offset = useMotionValue(reduceMotion ? 0 : -3.4);
  const velocity = useVelocity(offset);
  const swingTarget = useTransform(velocity, v => Math.max(-16, Math.min(16, -v * 3.2)));
  const swing = useSpring(swingTarget, { stiffness: 90, damping: 5, mass: 0.9 });

  const anim = useRef<AnimationPlaybackControls | null>(null);
  const target = useRef(0);
  const [activeSlot, setActiveSlot] = useState(0);
  const [stage, setStage] = useState(0); // how many turns the centred piece has made

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

  // ---- dragging -----------------------------------------------------------
  const drag = useRef<{ x: number; moved: number; id: number; captured: boolean } | null>(null);
  const suppressClick = useRef(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    anim.current?.stop();
    drag.current = { x: e.clientX, moved: 0, id: e.pointerId, captured: false };
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    d.x = e.clientX;
    d.moved += Math.abs(dx);
    if (!d.captured && d.moved > 6) {
      d.captured = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    offset.set(offset.get() - dx / chord);
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.moved > 6) {
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 60);
      const v = offset.getVelocity();
      const fling = Math.max(-5, Math.min(5, v * 0.28));
      settleTo(Math.round(offset.get() + fling), v);
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

  function onTap(slot: number) {
    if (suppressClick.current) return;
    if (slot !== activeSlot) { goToSlot(slot); return; }
    const product = products[slot % P];
    const turns = viewsOf(product).length - 1;
    if (stage < turns) { setStage(stage + 1); return; }
    // last tap opens the blurred product view (size + add to bag)
    onOpen(product);
    window.setTimeout(() => setStage(0), 600);
  }

  // static rail segments that form the curved bar
  const railSegments = useMemo(() => {
    const seg = 2.5;
    const width = 2 * geo.R * Math.sin((seg * Math.PI) / 360) + 1.5;
    const out: { a: number; w: number; o: number }[] = [];
    for (let a = -RAIL_ARC; a <= RAIL_ARC + 0.01; a += seg) {
      const edge = Math.abs(a);
      out.push({ a, w: width, o: edge < 60 ? 1 : Math.max(0, 1 - (edge - 60) / (RAIL_ARC - 60)) });
    }
    return out;
  }, [geo.R]);

  if (!P) return null;
  const activeProduct = activeSlot % P;
  const cur = products[activeProduct];
  const curTurns = viewsOf(cur).length - 1;
  const hint = stage === 0
    ? 'Drag the rail · tap a piece to turn it'
    : stage < curTurns ? 'Tap again to see the back'
    : 'Tap again to choose a size';
  const gh = geo.gw * IMAGE_RATIO;

  return (
    <div className="rail3d">
      <div
        className="rail3d-stage"
        style={{ perspective: geo.perspective, height: gh + 70 }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Clothing rail — drag or use arrow keys"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
      >
        <div className="rail3d-ring" style={{ transform: `translateZ(${-geo.R}px)` }}>
          {railSegments.map(s => (
            <span
              key={s.a}
              className="rail3d-seg"
              style={{ width: s.w, marginLeft: -s.w / 2, opacity: s.o, transform: `rotateY(${s.a}deg) translateZ(${geo.R - 2}px)` }}
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
              stage={slot === activeSlot ? stage : 0}
              onTap={onTap}
            />
          ))}
        </div>
      </div>

      <div className="rail3d-footer">
        <p className="rail3d-hint">
          {hint}
        </p>
        <div className="rail3d-nav">
          <button aria-label="Previous piece" onClick={() => step(-1)}><ArrowLeft size={16} /></button>
          <div className="rail3d-dots" role="tablist" aria-label="Choose a piece">
            {products.map((p, i) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={i === activeProduct}
                aria-label={p.name}
                className={i === activeProduct ? 'is-active' : ''}
                onClick={() => goToProduct(i)}
              />
            ))}
          </div>
          <button aria-label="Next piece" onClick={() => step(1)}><ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}

type GarmentProps = {
  slot: number; slots: number; product: Product; geo: Geo; gh: number;
  offset: MotionValue<number>; swing: MotionValue<number>;
  isActive: boolean; stage: number; onTap: (slot: number) => void;
};

function Garment({ slot, slots, product, geo, gh, offset, swing, isActive, stage, onTap }: GarmentProps) {
  const [canHover, setCanHover] = useState(false);
  useEffect(() => { setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches); }, []);
  const angle = useTransform(offset, o => ringDelta(slot - o, slots) * geo.step);
  const transform = useTransform(angle, a => `rotateY(${a}deg) translateZ(${geo.R}px)`);
  const opacity = useTransform(angle, fadeFor);
  const visibility = useTransform(opacity, o => (o < 0.01 ? 'hidden' : 'visible'));
  // each piece swings a little differently, so the rail feels physical
  const k = 0.8 + ((slot * 37) % 10) / 22;
  const pieceSwing = useTransform(swing, s => s * k);
  const views = viewsOf(product);

  return (
    <motion.div
      className={`g3d ${isActive ? 'is-active' : ''}`}
      style={{ transform, visibility, width: geo.gw, marginLeft: -geo.gw / 2, top: -HOOK_Y * gh }}
    >
      <motion.div className="g3d-swing" style={{ rotateZ: pieceSwing }}>
        <motion.button
          type="button"
          className="g3d-turn g3d-seq"
          style={{ height: gh, opacity }}
          whileHover={canHover ? { scale: 1.045 } : undefined}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          onClick={() => onTap(slot)}
          aria-label={isActive ? `${product.name} — tap to continue` : `Bring ${product.name} to the front`}
          tabIndex={isActive ? 0 : -1}
        >
          <span className="g3d-glow" aria-hidden="true" />
          {views.map((src, i) => (
            <motion.img
              key={src}
              className="g3d-face g3d-flat"
              src={src}
              alt={i === 0 && isActive ? product.name : ''}
              draggable={false}
              initial={false}
              animate={{ opacity: stage === i ? 1 : 0, rotateY: stage === i ? 0 : i > stage ? -65 : 65, scale: stage === i ? 1 : 0.94 }}
              transition={{ type: 'spring', stiffness: 110, damping: 17 }}
            />
          ))}
        </motion.button>
        {storeConfig.rail.showPriceTags && (
          <motion.span className="g3d-tag" style={{ opacity }} aria-hidden="true">
            <i />{formatPrice(product.price)}
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );
}
