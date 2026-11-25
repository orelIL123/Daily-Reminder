# Database

Migrations in `migrations/` rebuild the whole store database on a fresh Supabase project, in order:

| File | What it does |
|---|---|
| `0001_store_core.sql` | Tables: categories, products, product_images (front/side/back/detail), product_variants (size × color, SKU, stock), customers, discount_codes, orders, order_items, order_events, newsletter_subscribers, stock_alerts, admin_users. Row-level security on every table. |
| `0002_order_functions.sql` | `place_order()` — server-side pricing, discounts, shipping, atomic stock reservation (30 min). `mark_order_paid()` — after the payment provider confirms. `release_expired_orders()` — returns stock from abandoned checkouts, runs every 5 min (pg_cron). `product-images` storage bucket. |
| `0003_seed_catalogue.sql` | Store-specific seed: categories + launch products. Demo pieces use `demo-` slugs. |
| `0004_security_hardening.sql` | `is_admin()` moved to a private schema, `citext` moved out of `public`. |
| `0008_settings_analytics_seo.sql` | `store_settings` (fonts + SEO, edited in the admin), per-product search title/description, `analytics_events` + `analytics_report()` for the admin dashboard, daily purge of events older than 400 days. |

Order functions are callable by the server (service role) only. Visitors can read active catalogue data and nothing else.

Make someone an admin (after they sign up):
```sql
insert into public.admin_users (user_id, role) select id, 'owner' from auth.users where email = 'owner@example.com';
```
