'use client';
import { isSoldOut } from '@/lib/useProducts';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Product } from '@/lib/products';
import { useI18n } from '@/lib/i18n/client';
import { imageFor } from '@/lib/views';
import { storeConfig } from '@/store.config';
import type { FlightOrigin } from '@/lib/flight';

/*
 * Option B — a straight shop rail.
 * Pieces hang packed together, seen from the side. Hover (desktop) or first tap (touch)
 * turns a piece to face you and makes room for it; click / second tap opens it.
 *
 * Controlled mode (activeId + onActiveChange + persistent): one piece always faces you,
 * glows and is marked "Featured" — used by the showcase section.
 */

const IMAGE_RATIO = 455 / 360;
const HOOK_Y = 0.028;
const SHADOW_ROOM = 60; // extra track height so the soft drop-shadows are not cut off

function sizes(w: number) {
  if (w < 600) return { slot: 58, open: 176, gw: 158 };
  if (w < 1000) return { slot: 74, open: 220, gw: 200 };
  return { slot: 92, open: 282, gw: 254 };
}

type Props = {
  products: Product[];
  onOpen: (p: Product, origin?: FlightOrigin) => void;
  /** The piece that is flying into the product view (hidden on the rail meanwhile). */
  hiddenId?: string | null;
  activeId?: string | null;
  onActiveChange?: (id: string | null) => void;
  /** Keep the last piece turned to the front when the pointer leaves. */
  persistent?: boolean;
  showLabels?: boolean;
  showHint?: boolean;
};

export default function FlatRail({ products, onOpen, activeId, onActiveChange, persistent = false, hiddenId, showLabels = true, showHint = true }: Props) {
  const [dims, setDims] = useState(() => sizes(1440));
  const { t, name, price } = useI18n();
  const [canHover, setCanHover] = useState(true);
  const [localActive, setLocalActive] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, x: 0, left: 0, moved: false });

  const controlled = activeId !== undefined;
  const active = controlled ? activeId : localActive;
  const setActive = (id: string | null) => { if (!controlled) setLocalActive(id); onActiveChange?.(id); };

  useEffect(() => {
    const r = () => setDims(sizes(window.innerWidth));
    r();
    window.addEventListener('resize', r);
    setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    return () => window.removeEventListener('resize', r);
  }, []);

  // keep the active piece in view when it changes from outside (arrows / dots)
  const firstScroll = useRef(true);
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !active) return;
    const instant = firstScroll.current;
    // wait for the open/close width spring to settle, then centre the piece
    const t = window.setTimeout(() => {
      const el = track.querySelector<HTMLElement>(`[data-id="${CSS.escape(active)}"]`);
      if (!el || track.scrollWidth <= track.clientWidth + 2) return;
      const target = el.offsetLeft + el.offsetWidth / 2 - track.clientWidth / 2;
      track.scrollTo({ left: target, behavior: instant ? 'auto' : 'smooth' });
      firstScroll.current = false;
    }, instant ? 650 : 160);
    return () => window.clearTimeout(t);
  }, [active, dims]);

  const gh = dims.gw * IMAGE_RATIO;

  function tap(p: Product, el: HTMLElement) {
    if (drag.current.moved) return;
    if (canHover || active === p.id) {
      const img = el.querySelector<HTMLImageElement>('.fr-img-face');
      onOpen(p, img ? { rect: img.getBoundingClientRect(), src: img.currentSrc || img.src } : undefined);
    } else setActive(p.id);
  }

  // desktop: drag the rail sideways
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse' || !trackRef.current) return;
    drag.current = { down: true, x: e.clientX, left: trackRef.current.scrollLeft, moved: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d.down || !trackRef.current) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 5) d.moved = true;
    if (d.moved) trackRef.current.scrollLeft = d.left - dx;
  }
  function endDrag() { drag.current.down = false; window.setTimeout(() => { drag.current.moved = false; }, 0); }

  return (
    <div className="flatrail" dir="ltr" onMouseLeave={() => { endDrag(); if (canHover && !persistent) setActive(null); }}>
      <div
        ref={trackRef}
        className="flatrail-track"
        style={{ height: gh + (showLabels ? 40 : 24) + SHADOW_ROOM, marginBottom: -SHADOW_ROOM }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag}
      >
        <div className="flatrail-items">
          <div className="flatrail-bar" aria-hidden="true"><i /><i /></div>
          {products.map(p => {
            const open = active === p.id;
            const side = imageFor(p, storeConfig.rail.straightRestView);
            const face = imageFor(p, storeConfig.rail.straightHoverView);
            return (
              <motion.button
                key={p.id}
                data-id={p.id}
                type="button"
                className={`fr-item ${open ? 'is-open' : ''} ${isSoldOut(p) ? 'is-soldout' : ''} ${hiddenId === p.id ? 'is-away' : ''}`}
                animate={{ width: open ? dims.open : dims.slot }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                style={{ height: gh, zIndex: open ? 5 : 1 }}
                onMouseEnter={() => canHover && !drag.current.down && setActive(p.id)}
                onFocus={e => { if (canHover || e.currentTarget.matches(':focus-visible')) setActive(p.id); }}
                onClick={e => tap(p, e.currentTarget)}
                aria-label={`${name(p)}, ${isSoldOut(p) ? t.product.soldOut : price(p.price)}`}
                aria-current={open ? 'true' : undefined}
              >
                <span className="fr-hang" style={{ width: dims.gw, height: gh, top: -HOOK_Y * gh }}>
                  <span className="fr-glow" aria-hidden="true" />
                  <motion.img
                    src={side} alt="" draggable={false} className="fr-img"
                    initial={false}
                    animate={{ opacity: open ? 0 : 1, rotateY: open ? 70 : 0 }}
                    transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                  />
                  <motion.img
                    src={face} alt="" draggable={false} className="fr-img fr-img-face"
                    initial={false}
                    animate={{ opacity: open ? 1 : 0, rotateY: open ? 0 : -70, scale: open ? 1.04 : 0.96 }}
                    transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                  />
                  {isSoldOut(p) && <span className="soldout-tag" aria-hidden="true">{t.product.soldOut}</span>}
                </span>
                {showLabels && (
                  <motion.span className="fr-label" initial={false} animate={{ opacity: open ? 1 : 0, y: open ? 0 : 6 }}>
                    <strong dir="auto">{name(p)}</strong>
                    <span>{price(p.price)}</span>
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      {showHint && <p className="flatrail-hint" dir="auto">{canHover ? t.rail.flatHintFine : t.rail.flatHintTouch}</p>}
    </div>
  );
}
