-- Nov 25, 2026
-- 1. Store settings the owner edits from the admin (fonts, SEO).
-- 2. Per-product search title / description.
-- 3. First-party analytics: visits, shopping funnel, where shoppers stop.

-- ── 1. settings ─────────────────────────────────────────────
-- Everything here is public (it shapes the public site) — never store secrets in this table.
create table public.store_settings (
  key text primary key check (key in ('theme', 'seo')),
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger store_settings_touch before update on public.store_settings
  for each row execute function public.touch_updated_at();
alter table public.store_settings enable row level security;
create policy "public reads store settings" on public.store_settings for select using (true);
create policy "admins insert store settings" on public.store_settings for insert with check ((select private.is_admin()));
create policy "admins update store settings" on public.store_settings for update using ((select private.is_admin()));

-- ── 2. product SEO ──────────────────────────────────────────
alter table public.products add column seo_title text not null default '';
alter table public.products add column seo_description text not null default '';

-- ── 3. analytics ────────────────────────────────────────────
-- Anonymous: random ids made in the browser. No IP address, name, email or phone is stored.
-- Rows are written only by the server (service role); only admins can read them.
create table public.analytics_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visitor_id uuid not null,
  session_id uuid not null,
  type text not null check (type in ('page_view', 'product_view', 'add_to_cart', 'checkout_start',
                                     'checkout_field', 'checkout_submit', 'checkout_error', 'order_placed')),
  path text not null default '',
  product_id uuid,
  detail text not null default '',          -- checkout field name / error code
  referrer text not null default '',        -- host name only
  utm_source text not null default '',
  utm_campaign text not null default '',
  device text not null default '' check (device in ('', 'mobile', 'tablet', 'desktop')),
  country text not null default ''
);
create index analytics_events_created_idx on public.analytics_events(created_at);
create index analytics_events_session_idx on public.analytics_events(session_id);
alter table public.analytics_events enable row level security;
create policy "admins read analytics" on public.analytics_events for select using ((select private.is_admin()));

-- Totals for a date range (Israel time). Funnel step N counts visits that got to step N or further:
-- 1 visit · 2 viewed a product · 3 added to bag · 4 opened checkout · 5 pressed pay · 6 order created
create or replace function public.analytics_totals(p_from date, p_to date) returns jsonb
language sql stable security invoker set search_path = '' as $$
  with ev as (
    select * from public.analytics_events
     where created_at >= (p_from::timestamp at time zone 'Asia/Jerusalem')
       and created_at <  ((p_to + 1)::timestamp at time zone 'Asia/Jerusalem')
  ),
  s as (
    select session_id,
           max(case type when 'order_placed' then 6 when 'checkout_submit' then 5 when 'checkout_error' then 5
                         when 'checkout_field' then 4 when 'checkout_start' then 4
                         when 'add_to_cart' then 3 when 'product_view' then 2 else 1 end) as stage,
           count(*) filter (where type = 'page_view') as views
      from ev group by session_id
  ),
  o as (
    select * from public.orders
     where created_at >= (p_from::timestamp at time zone 'Asia/Jerusalem')
       and created_at <  ((p_to + 1)::timestamp at time zone 'Asia/Jerusalem')
  )
  select jsonb_build_object(
    'visitors',   (select count(distinct visitor_id) from ev),
    'sessions',   (select count(*) from s),
    'page_views', (select count(*) from ev where type = 'page_view'),
    'bounced',    (select count(*) from s where stage = 1 and views <= 1),
    'funnel',     (select jsonb_agg((select count(*) from s where s.stage >= g) order by g) from generate_series(1, 6) g),
    'orders',     (select count(*) from o where status <> 'cancelled'),
    'paid_orders',(select count(*) from o where status in ('paid', 'processing', 'shipped', 'delivered')),
    'revenue',    (select coalesce(sum(total), 0) from o where status in ('paid', 'processing', 'shipped', 'delivered'))
  );
$$;

create or replace function public.analytics_report(p_days int default 30) returns jsonb
language sql stable security invoker set search_path = '' as $$
  with r as (
    select today - (greatest(1, least(p_days, 366)) - 1) as d_from, today as d_to,
           greatest(1, least(p_days, 366)) as n
      from (select (now() at time zone 'Asia/Jerusalem')::date as today) t
  ),
  ev as (
    select e.*, (e.created_at at time zone 'Asia/Jerusalem')::date as day
      from public.analytics_events e, r
     where e.created_at >= (r.d_from::timestamp at time zone 'Asia/Jerusalem')
  ),
  s as (
    select session_id,
           (array_agg(referrer order by id))[1]   as referrer,
           (array_agg(utm_source order by id))[1] as utm_source,
           (array_agg(device order by id))[1]     as device,
           (array_agg(country order by id))[1]    as country,
           (array_agg(path order by id desc) filter (where type = 'page_view' or type = 'product_view'))[1] as last_path,
           (array_agg(detail order by id desc) filter (where type = 'checkout_field'))[1] as last_field,
           bool_or(type = 'checkout_start')  as in_checkout,
           bool_or(type = 'checkout_submit') as submitted,
           bool_or(type = 'order_placed')    as ordered
      from ev group by session_id
  ),
  o as (
    select ord.*, (ord.created_at at time zone 'Asia/Jerusalem')::date as day
      from public.orders ord, r
     where ord.created_at >= (r.d_from::timestamp at time zone 'Asia/Jerusalem') and ord.status <> 'cancelled'
  )
  select jsonb_build_object(
    'from', r.d_from, 'to', r.d_to,
    'live', (select count(distinct visitor_id) from public.analytics_events where created_at > now() - interval '5 minutes'),
    'totals', public.analytics_totals(r.d_from, r.d_to),
    'previous', public.analytics_totals(r.d_from - r.n, r.d_from - 1),
    'first_event', (select min(created_at) from public.analytics_events),
    'daily', (
      select jsonb_agg(jsonb_build_object(
               'day', g::date,
               'visitors', (select count(distinct visitor_id) from ev where ev.day = g::date),
               'sessions', (select count(distinct session_id) from ev where ev.day = g::date),
               'page_views', (select count(*) from ev where ev.day = g::date and type = 'page_view'),
               'orders', (select count(*) from o where o.day = g::date)
             ) order by g)
        from generate_series(r.d_from::timestamp, r.d_to::timestamp, interval '1 day') g
    ),
    'sources', coalesce((select jsonb_agg(x order by x.sessions desc) from (
        select coalesce(nullif(utm_source, ''), nullif(referrer, ''), '') as source,
               count(*) as sessions, count(*) filter (where ordered) as orders
          from s group by 1 order by 2 desc limit 8) x), '[]'::jsonb),
    'devices', coalesce((select jsonb_agg(x order by x.sessions desc) from (
        select device, count(*) as sessions, count(*) filter (where ordered) as orders from s group by 1) x), '[]'::jsonb),
    'countries', coalesce((select jsonb_agg(x order by x.sessions desc) from (
        select country, count(*) as sessions from s where country <> '' group by 1 order by 2 desc limit 6) x), '[]'::jsonb),
    'pages', coalesce((select jsonb_agg(x order by x.views desc) from (
        select path, count(*) as views, count(distinct visitor_id) as visitors
          from ev where type = 'page_view' group by 1 order by 2 desc limit 10) x), '[]'::jsonb),
    'exits', coalesce((select jsonb_agg(x order by x.sessions desc) from (
        select last_path as path, count(*) as sessions
          from s where not ordered and last_path is not null group by 1 order by 2 desc limit 8) x), '[]'::jsonb),
    'checkout_stops', coalesce((select jsonb_agg(x order by x.sessions desc) from (
        select coalesce(last_field, '') as field, count(*) as sessions
          from s where in_checkout and not submitted and not ordered group by 1) x), '[]'::jsonb),
    'errors', coalesce((select jsonb_agg(x order by x.times desc) from (
        select detail as code, count(*) as times from ev where type = 'checkout_error' group by 1 order by 2 desc limit 8) x), '[]'::jsonb),
    'products', coalesce((select jsonb_agg(x order by x.views desc, x.carts desc) from (
        select p.id, p.name_he as name,
               count(distinct ev.session_id) filter (where ev.type = 'product_view') as views,
               count(distinct ev.session_id) filter (where ev.type = 'add_to_cart')  as carts,
               coalesce((select sum(oi.quantity) from public.order_items oi join o on o.id = oi.order_id where oi.product_id = p.id), 0) as units
          from ev join public.products p on p.id = ev.product_id
         group by p.id, p.name_he order by 3 desc, 4 desc limit 12) x), '[]'::jsonb)
  )
  from r;
$$;

revoke all on function public.analytics_totals(date, date) from public, anon;
revoke all on function public.analytics_report(int) from public, anon;
grant execute on function public.analytics_totals(date, date) to authenticated;
grant execute on function public.analytics_report(int) to authenticated;

-- keep a bit over a year of raw events
select cron.schedule('purge-old-analytics', '17 3 * * *',
  $$delete from public.analytics_events where created_at < now() - interval '400 days'$$);
