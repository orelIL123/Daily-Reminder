-- ─────────────────────────────────────────────────────────────
-- Store core schema: catalogue, customers, orders, discounts,
-- newsletter, admins. Reusable for any store built from this kit.
-- ─────────────────────────────────────────────────────────────

create extension if not exists citext;

-- enums
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.image_view as enum ('front', 'side', 'back', 'detail');
create type public.order_status as enum ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
create type public.discount_type as enum ('percent', 'fixed', 'free_shipping');
create type public.admin_role as enum ('owner', 'admin', 'staff');

-- updated_at helper
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ── admins ──────────────────────────────────────────────────
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.admin_role not null default 'admin',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

-- ── catalogue ───────────────────────────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_he text not null,
  name_en text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  show_in_nav boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  name_he text not null,
  name_en text not null,
  description_he text not null default '',
  description_en text not null default '',
  status public.product_status not null default 'draft',
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create index products_status_sort_idx on public.products(status, sort_order);
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  view public.image_view not null,
  url text not null,
  alt_he text not null default '',
  alt_en text not null default '',
  sort_order int not null default 0
);
create index product_images_product_idx on public.product_images(product_id);
create unique index product_images_one_main_view on public.product_images(product_id, view) where view <> 'detail';

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  color text not null default '',
  sku text unique,
  price_override numeric(10,2) check (price_override is null or price_override >= 0),
  stock int not null default 0 check (stock >= 0),
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique (product_id, size, color)
);
create index product_variants_product_idx on public.product_variants(product_id);

-- ── customers ───────────────────────────────────────────────
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email citext not null unique,
  name text not null default '',
  phone text not null default '',
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── discounts ───────────────────────────────────────────────
create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code citext not null unique,
  type public.discount_type not null,
  value numeric(10,2) not null default 0 check (value >= 0),
  min_subtotal numeric(10,2) not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int,
  used_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── orders ──────────────────────────────────────────────────
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint not null unique default nextval('public.order_number_seq'),
  customer_id uuid references public.customers(id) on delete set null,
  email citext not null,
  name text not null,
  phone text not null,
  shipping_address jsonb not null default '{}'::jsonb,
  locale text not null default 'he',
  status public.order_status not null default 'pending_payment',
  subtotal numeric(10,2) not null,
  discount_total numeric(10,2) not null default 0,
  shipping_total numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  currency text not null default 'ILS',
  discount_code citext,
  payment_provider text,
  payment_ref text,
  paid_at timestamptz,
  reserved_until timestamptz,
  customer_note text not null default '',
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_created_idx on public.orders(status, created_at desc);
create index orders_customer_idx on public.orders(customer_id);
create index orders_email_idx on public.orders(email);
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  name text not null,
  size text not null,
  color text not null default '',
  sku text,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null
);
create index order_items_order_idx on public.order_items(order_id);
create index order_items_variant_idx on public.order_items(variant_id);
create index order_items_product_idx on public.order_items(product_id);

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  type text not null,
  data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events(order_id);
create index order_events_created_by_idx on public.order_events(created_by);

-- ── marketing ───────────────────────────────────────────────
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  locale text not null default 'he',
  source text not null default 'site',
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table public.stock_alerts (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  email citext not null,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique (variant_id, email)
);

-- ── row level security ──────────────────────────────────────
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers enable row level security;
alter table public.discount_codes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.stock_alerts enable row level security;

-- public storefront reads
create policy "public reads active categories" on public.categories for select
  using (is_active or (select public.is_admin()));
create policy "public reads active products" on public.products for select
  using (status = 'active' or (select public.is_admin()));
create policy "public reads images of active products" on public.product_images for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.status = 'active' or (select public.is_admin()))));
create policy "public reads variants of active products" on public.product_variants for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.status = 'active' or (select public.is_admin()))));

-- admin writes on catalogue
create policy "admins insert categories" on public.categories for insert with check ((select public.is_admin()));
create policy "admins update categories" on public.categories for update using ((select public.is_admin()));
create policy "admins delete categories" on public.categories for delete using ((select public.is_admin()));
create policy "admins insert products" on public.products for insert with check ((select public.is_admin()));
create policy "admins update products" on public.products for update using ((select public.is_admin()));
create policy "admins delete products" on public.products for delete using ((select public.is_admin()));
create policy "admins insert images" on public.product_images for insert with check ((select public.is_admin()));
create policy "admins update images" on public.product_images for update using ((select public.is_admin()));
create policy "admins delete images" on public.product_images for delete using ((select public.is_admin()));
create policy "admins insert variants" on public.product_variants for insert with check ((select public.is_admin()));
create policy "admins update variants" on public.product_variants for update using ((select public.is_admin()));
create policy "admins delete variants" on public.product_variants for delete using ((select public.is_admin()));

-- customers: own row (returning customers) or admin
create policy "customers read own or admin" on public.customers for select
  using (auth_user_id = (select auth.uid()) or (select public.is_admin()));
create policy "admins update customers" on public.customers for update using ((select public.is_admin()));

-- orders: own orders or admin; creation only through place_order() (service role)
create policy "read own orders or admin" on public.orders for select
  using ((select public.is_admin()) or customer_id in (select c.id from public.customers c where c.auth_user_id = (select auth.uid())));
create policy "admins update orders" on public.orders for update using ((select public.is_admin()));
create policy "read own order items or admin" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and ((select public.is_admin()) or o.customer_id in (select c.id from public.customers c where c.auth_user_id = (select auth.uid())))));
create policy "admins read order events" on public.order_events for select using ((select public.is_admin()));
create policy "admins add order events" on public.order_events for insert with check ((select public.is_admin()));

-- admin-only tables
create policy "admins read admins" on public.admin_users for select using ((select public.is_admin()));
create policy "admins manage discounts" on public.discount_codes for select using ((select public.is_admin()));
create policy "admins insert discounts" on public.discount_codes for insert with check ((select public.is_admin()));
create policy "admins update discounts" on public.discount_codes for update using ((select public.is_admin()));
create policy "admins delete discounts" on public.discount_codes for delete using ((select public.is_admin()));
create policy "admins read newsletter" on public.newsletter_subscribers for select using ((select public.is_admin()));
create policy "admins update newsletter" on public.newsletter_subscribers for update using ((select public.is_admin()));
create policy "admins read stock alerts" on public.stock_alerts for select using ((select public.is_admin()));
-- newsletter / stock-alert sign-ups go through server routes (service role), not direct inserts.
