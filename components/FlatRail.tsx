'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Product } from '@/lib/products';
import { formatPrice } from '@/lib/money';
import { imageFor } from '@/lib/views';
import { storeConfig } from '@/store.config';

/*
 * Option B — a straight shop rail.
 * Pieces hang packed together, seen from the side. Hover (desktop) or first tap (touch)
 * turns a piece to face you and makes room for it; click / second tap opens it.
 */

const IMAGE_RATIO = 455 / 360;
const HOOK_Y = 0.028;

function sizes(w: number) {
  if (w < 600) return { slot: 58, open: 168, gw: 150 };
  if (w < 1000) return { slot: 74, open: 210, gw: 190 };
  return { slot: 92, open: 262, gw: 236 };
}

export default function FlatRail({ products, onOpen }: { products: Product[]; onOpen: (p: Product) => void }) {
  const [dims, setDims] = useState(() => sizes(1440));
  const [canHover, setCanHover] = useState(true);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const r = () => setDims(sizes(window.innerWidth));
    r();
    window.addEventListener('resize', r);
    setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    return () => window.removeEventListener('resize', r);
  }, []);

  const gh = dims.gw * IMAGE_RATIO;

  function tap(p: Product) {
    if (canHover || active === p.id) onOpen(p);
    else setActive(p.id);
  }

  return (
    <div className="flatrail" onMouseLeave={() => canHover && setActive(null)}>
      <div className="flatrail-track" style={{ height: gh + 40 }}>
        <div className="flatrail-bar" aria-hidden="true" />
        <div className="flatrail-items">
          {products.map(p => {
            const open = active === p.id;
            const side = imageFor(p, storeConfig.rail.straightRestView);
            const face = imageFor(p, storeConfig.rail.straightHoverView);
            return (
              <motion.button
                key={p.id}
                type="button"
                className={`fr-item ${open ? 'is-open' : ''}`}
                animate={{ width: open ? dims.open : dims.slot }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                style={{ height: gh, zIndex: open ? 5 : 1 }}
                onMouseEnter={() => canHover && setActive(p.id)}
                onFocus={e => { if (canHover || e.currentTarget.matches(":focus-visible")) setActive(p.id); }}
                onClick={() => tap(p)}
                aria-label={`${p.name}, ${formatPrice(p.price)}`}
              >
                <span className="fr-hang" style={{ width: dims.gw, height: gh, top: -HOOK_Y * gh }}>
                  <motion.img
                    src={side} alt="" draggable={false} className="fr-img"
                    initial={false}
                    animate={{ opacity: open ? 0 : 1, rotateY: open ? 70 : 0 }}
                    transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                  />
                  <motion.img
                    src={face} alt="" draggable={false} className="fr-img"
                    initial={false}
                    animate={{ opacity: open ? 1 : 0, rotateY: open ? 0 : -70, scale: open ? 1.04 : 0.96 }}
                    transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                  />
                </span>
                <motion.span className="fr-label" initial={false} animate={{ opacity: open ? 1 : 0, y: open ? 0 : 6 }}>
                  <strong>{p.name}</strong>
                  <span>{formatPrice(p.price)}</span>
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </div>
      <p className="flatrail-hint">{canHover ? 'Hover a piece to see the front · click to open' : 'Tap a piece to see the front · tap again to open'}</p>
    </div>
  );
}
