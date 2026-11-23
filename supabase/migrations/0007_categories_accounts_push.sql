-- Nov 23, 2026
-- 1. New categories: layered (double-sleeve) tees, pants, hats, kippot, shoes.
-- 2. Customer accounts: a signed-in shopper is linked to their customer record (and so to their orders).
-- 3. Web push: device subscriptions + a log of messages the admin sent.

-- ── 1. categories ───────────────────────────────────────────
insert into public.categories (slug, name_he, name_en, sort_order, is_active, show_in_nav) values
  ('layered-tees', 'חולצות שני שרוולים', 'Layered Tees', 2, true, true),
  ('pants',        'מכנסיים',            'Pants',        7, true, true),
  ('hats',         'כובעים',             'Hats',         8, true, true),
  ('kippot',       'כיפות',              'Kippot',       9, true, true),
  ('shoes',        'נעליים',             'Shoes',       10, true, true)
on conflict (slug) do nothing;

update public.categories set sort_order = 1 where slug = 'tees';
update public.categories set sort_order = 3 where slug = 'tzitzit';
update public.categories set sort_order = 4 where slug = 'hoodies';
update public.categories set sort_order = 5 where slug = 'sweatshirts';
update public.categories set sort_order = 6 where slug = 'outerwear';

-- ── 2. customer accounts ────────────────────────────────────
-- Called by a signed-in shopper (account page, after sign-in). Links the customer row that has the
-- same, confirmed email — so orders placed as a guest before signing up show up in the account.
create or replace function public.link_my_customer() returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_name text;
  v_confirmed timestamptz;
  v_id uuid;
begin
  if v_uid is null then return null; end if;
  select lower(email), email_confirmed_at, coalesce(raw_user_meta_data->>'name', '')
    into v_email, v_confirmed, v_name
    from auth.users where id = v_uid;
  if v_email is null or v_confirmed is null then return null; end if;

  select id into v_id from public.customers where auth_user_id = v_uid;
  if v_id is not null then return v_id; end if;

  update public.customers set auth_user_id = v_uid
   where email = v_email and auth_user_id is null
   returning id into v_id;
  if v_id is not null then return v_id; end if;

  insert into public.customers (email, name, auth_user_id) values (v_email, v_name, v_uid)
  on conflict (email) do nothing
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.link_my_customer() from public, anon;
grant execute on function public.link_my_customer() to authenticated;

-- a shopper may update their own name / phone
create policy "customers update own profile" on public.customers for update to authenticated
  using (auth_user_id = (select auth.uid())) with check (auth_user_id = (select auth.uid()));
revoke update on public.customers from authenticated;
grant update (name, phone, marketing_opt_in) on public.customers to authenticated;

-- ── 3. web push ─────────────────────────────────────────────
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text not null default '',
  standalone boolean not null default false,
  created_at timestamptz not null default now(),
  last_success_at timestamptz
);
alter table public.push_subscriptions enable row level security;
create policy "admins read push subscriptions" on public.push_subscriptions for select using ((select private.is_admin()));

create table public.push_messages (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null default '',
  url text not null default '/',
  sent_count int not null default 0,
  failed_count int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.push_messages enable row level security;
create policy "admins read push messages" on public.push_messages for select using ((select private.is_admin()));
create index push_messages_created_by_idx on public.push_messages(created_by);

-- ── 4. order alerts for the admin ───────────────────────────
-- A subscription with admin_user_id gets a push for every new order.
alter table public.push_subscriptions add column admin_user_id uuid references auth.users(id) on delete cascade;
create index push_subscriptions_admin_idx on public.push_subscriptions(admin_user_id) where admin_user_id is not null;
-- courier tracking number, filled in when the order ships
alter table public.orders add column tracking_number text not null default '';
