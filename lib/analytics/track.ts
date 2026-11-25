'use client';
import type { EventData, EventType } from './events';

/*
 * First-party, anonymous analytics: a random visitor id kept in this browser, a visit that ends after
 * 30 quiet minutes, and no names, emails, addresses or typed text.
 * Not counted: the owner's own browser (signed in to the admin), local development, and browsers
 * that send Global Privacy Control.
 */
const VISITOR_KEY = 'dr-vid';
const SESSION_KEY = 'dr-visit';
const IDLE_MS = 30 * 60 * 1000;
type Visit = { id: string; last: number; referrer: string; utmSource: string; utmCampaign: string };

let memoryVisitor = '';
let memoryVisit: Visit | null = null;

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)));

function read(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function write(key: string, v: string) { try { localStorage.setItem(key, v); } catch { /* private mode: keep it in memory */ } }

function skip() {
  if (typeof window === 'undefined') return true;
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (local && process.env.NEXT_PUBLIC_TRACK_LOCAL !== '1') return true;
  if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return true;
  return !!read('dr-admin-auth');
}

function visitor() {
  const id = read(VISITOR_KEY) || memoryVisitor || uuid();
  memoryVisitor = id; write(VISITOR_KEY, id);
  return id;
}

function visit(): Visit {
  const now = Date.now();
  let v: Visit | null = memoryVisit;
  try { v = JSON.parse(read(SESSION_KEY) || 'null') ?? v; } catch { /* start over */ }
  const params = new URLSearchParams(location.search);
  const utmSource = params.get('utm_source') ?? (params.has('gclid') ? 'google-ads' : '');
  // a new campaign link starts a new visit, so it gets the credit
  if (!v || now - v.last > IDLE_MS || (utmSource && utmSource !== v.utmSource)) {
    let referrer = '';
    try {
      const h = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '';
      referrer = h === location.hostname.replace(/^www\./, '') ? '' : h;
    } catch { /* malformed referrer */ }
    v = { id: uuid(), last: now, referrer, utmSource, utmCampaign: params.get('utm_campaign') ?? '' };
  }
  v.last = now;
  memoryVisit = v; write(SESSION_KEY, JSON.stringify(v));
  return v;
}

export function track(type: EventType, data: EventData = {}) {
  try {
    if (skip()) return;
    const v = visit();
    const body = JSON.stringify({
      type, ...data, visitorId: visitor(), sessionId: v.id,
      path: location.pathname, referrer: v.referrer, utmSource: v.utmSource, utmCampaign: v.utmCampaign,
    });
    // sendBeacon survives leaving the page (e.g. the jump to the payment page)
    if (!navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))) {
      void fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  } catch { /* measuring must never break the shop */ }
}
