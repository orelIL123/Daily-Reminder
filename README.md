# Daily Reminder — 3D Rail Storefront

Next.js 15 / React 19 storefront built around a curved 3D clothing rail.

```bash
npm install
npm run dev        # http://localhost:3000
```

## What's in it

| Area | Where |
|---|---|
| 3D curved rail — drag / fling / arrows / trackpad, garments swing on their hooks, tap to turn, tap again to open | `components/Rail3D.tsx` |
| Product sheet — turn front/back, color, size, quantity, add to bag | `components/ProductSheet.tsx` |
| Cart (saved in the browser) + side drawer | `lib/cart.tsx`, `components/CartDrawer.tsx` |
| Checkout page → `/api/checkout` (prices re-checked on the server) → payment provider → `/checkout/success` | `app/checkout`, `app/api/checkout/route.ts` |
| Payment provider adapter (currently `demo`) | `lib/payments/index.ts` |
| Currency (₪) | `lib/money.ts` |
| Products (demo data) | `lib/products.ts`, browser-local editor at `/admin` |

## Tuning the rail

All knobs are at the top of `components/Rail3D.tsx`:

- `geoFor()` — ring radius `R`, angle between pieces `step`, garment width `gw`, camera `perspective` per screen size
- `FADE_START` / `FADE_END` — where pieces fade out around the curve
- `HOOK_Y` — where the hanger hook sits inside the image (so it lands on the rail)
- `IMAGE_RATIO` — height / width of the garment images
- swing feel: the `useSpring(swingTarget, …)` line

## Real product photos (next step)

For the rail to look like the reference, each product needs:

1. **Front** — garment on a hanger, shot straight on, **transparent background** (PNG/WebP), all photos same canvas size and same hanger position.
2. **Back** (`backImage`) — same framing. Shown when a shopper taps to turn the piece.
3. Optional **side** (`sideImage`) — used as the turned view if there is no back photo.

Keep each image around 1200 px tall and under ~300 KB (WebP). After swapping, adjust `HOOK_Y` and `IMAGE_RATIO` once.

## Going live with payments

Stripe does not support Israeli businesses. Pick one:

- **Shopify (headless)** — Shopify keeps products, stock, orders and checkout; this site stays the front end via the Storefront API. Least to build and maintain.
- **Israeli processor with a hosted payment page** — PayPlus, Grow (Meshulam), Cardcom or Tranzila. Implement `createPaymentSession` for it in `lib/payments/index.ts`, add a webhook route to mark orders paid, and store orders in a database (e.g. Supabase).

Set `PAYMENT_PROVIDER` in `.env.local` once a provider is implemented. Until then checkout runs in **demo mode** (no charge).

Before launch you also need: a database for products and orders, an authenticated admin, order confirmation emails, terms / returns / privacy / accessibility pages (Israeli law requires an accessibility statement).
