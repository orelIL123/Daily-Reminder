'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { storeConfig } from '@/store.config';
import { useI18n } from '@/lib/i18n/client';

/*
 * "Behind the collection" — the mood board and packaging shots, laid out like pages pinned to a studio wall.
 * Content lives in storeConfig.editorial.
 */
export default function Editorial() {
  const { editorial } = storeConfig;
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [main, second, ...details] = editorial.tiles;

  const rise = (i: number) => (reduce ? {} : {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  });

  return (
    <section id="editorial" className="editorial" aria-label={t.editorial.label}>
      <div className="editorial-copy">
        <p className="editorial-eyebrow">{editorial.eyebrow}</p>
        <h2>{editorial.title}</h2>
        <p className="editorial-text">{editorial.text}</p>
        <ol className="editorial-steps">{editorial.steps.map(s => <li key={s}>{s}</li>)}</ol>
      </div>

      <div className="editorial-board">
        {main && (
          <motion.figure className="ed-tile ed-main" {...rise(0)}>
            <img src={main.src} alt={main.alt} loading="lazy" style={{ objectPosition: main.focus }} />
          </motion.figure>
        )}
        {second && (
          <motion.figure className="ed-tile ed-second" {...rise(1)}>
            <img src={second.src} alt={second.alt} loading="lazy" style={{ objectPosition: second.focus }} />
          </motion.figure>
        )}
        <div className="ed-details">
          {details.map((d, i) => (
            <motion.figure key={d.src} className="ed-tile ed-detail" {...rise(i + 2)}>
              <img src={d.src} alt={d.alt} loading="lazy" style={{ objectPosition: d.focus }} />
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
