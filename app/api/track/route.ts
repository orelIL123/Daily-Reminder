import { supabaseAdmin } from '@/lib/supabase/admin';
import { EVENT_TYPES, type EventType } from '@/lib/analytics/events';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor|curl|wget|python/i;
const done = () => new Response(null, { status: 204 });

// A light per-address limit against floods. The address is only held in memory, never stored.
const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string) {
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const h = hits.get(ip);
  if (!h || now > h.reset) { hits.set(ip, { n: 1, reset: now + 60_000 }); return false; }
  return ++h.n > 120;
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

export async function POST(req: Request) {
  const ua = req.headers.get('user-agent') ?? '';
  if (!ua || BOTS.test(ua)) return done();
  // only this site's own pages may report
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (origin) { try { if (new URL(origin).host !== host) return done(); } catch { return done(); } }
  if (limited(req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown')) return done();

  let b: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 2000) return done();
    b = JSON.parse(raw);
  } catch { return done(); }
  if (!b || !EVENT_TYPES.includes(b.type as EventType)) return done();
  const visitorId = text(b.visitorId, 36), sessionId = text(b.sessionId, 36), productId = text(b.productId, 36);
  if (!UUID.test(visitorId) || !UUID.test(sessionId)) return done();
  const path = text(b.path, 200).replace(/^\/en(?=\/|$)/, '') || '/';
  if (path.startsWith('/admin')) return done();

  const db = supabaseAdmin();
  if (!db) return done();
  const { error } = await db.from('analytics_events').insert({
    type: b.type, visitor_id: visitorId, session_id: sessionId, path,
    product_id: UUID.test(productId) ? productId : null,
    detail: text(b.detail, 40).replace(/[^a-z0-9_]/gi, ''),   // field names and error codes only
    referrer: text(b.referrer, 100), utm_source: text(b.utmSource, 60), utm_campaign: text(b.utmCampaign, 80),
    device: /ipad|tablet|android(?!.*mobile)/i.test(ua) ? 'tablet' : /mobi|iphone|android/i.test(ua) ? 'mobile' : 'desktop',
    country: text(req.headers.get('x-vercel-ip-country'), 2),
  });
  if (error) console.error('[track] insert failed:', error.message);
  return done();
}
