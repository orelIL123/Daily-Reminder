-- ─────────────────────────────────────────────────────────────
-- Order logic: place an order with server-side pricing and atomic
-- stock reservation; mark paid after the payment provider confirms;
-- release reservations that were never paid. Service role only.
-- ─────────────────────────────────────────────────────────────

create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_item jsonb;
  v_row record;
  v_qty int;
  v_unit numeric(10,2);
  v_subtotal numeric(10,2) := 0;
  v_discount numeric(10,2) := 0;
  v_shipping numeric(10,2);
  v_free_from numeric(10,2) := coalesce((p->>'free_shipping_from')::numeric, 0);
  v_ship_price numeric(10,2) := coalesce((p->>'shipping_price')::numeric, 0);
  v_code public.discount_codes%rowtype;
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number bigint;
  v_lines jsonb := '[]'::jsonb;
  v_email text := lower(trim(p->>'email'));
begin
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email'; end if;
  if coalesce(trim(p->>'name'), '') = '' or coalesce(trim(p->>'phone'), '') = '' then raise exception 'missing_contact'; end if;
  if jsonb_typeof(p->'items') <> 'array' or jsonb_array_length(p->'items') = 0 then raise exception 'empty_cart'; end if;

  -- lock variants in a stable order to avoid deadlocks, then reserve stock
  for v_item in select value from jsonb_array_elements(p->'items') order by value->>'variant_id' loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 20 then raise exception 'invalid_quantity'; end if;

    select v.id as variant_id, v.size, v.color, v.sku, v.stock, v.price_override,
           pr.id as product_id, pr.name_he, pr.name_en, pr.price
      into v_row
      from public.product_variants v
      join public.products pr on pr.id = v.product_id
     where v.id = (v_item->>'variant_id')::uuid and v.is_active and pr.status = 'active'
     for update of v;
    if not found then raise exception 'unavailable:%', v_item->>'variant_id'; end if;
    if v_row.stock < v_qty then raise exception 'out_of_stock:%', coalesce(v_row.sku, v_row.variant_id::text); end if;

    update public.product_variants set stock = stock - v_qty where id = v_row.variant_id;

    v_unit := coalesce(v_row.price_override, v_row.price);
    v_subtotal := v_subtotal + v_unit * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_row.product_id, 'variant_id', v_row.variant_id,
      'name', case when p->>'locale' = 'en' then v_row.name_en else v_row.name_he end,
      'size', v_row.size, 'color', v_row.color, 'sku', v_row.sku,
      'unit_price', v_unit, 'quantity', v_qty, 'line_total', v_unit * v_qty);
  end loop;

  v_shipping := case when v_free_from > 0 and v_subtotal >= v_free_from then 0 else v_ship_price end;

  -- discount code
  if coalesce(trim(p->>'discount_code'), '') <> '' then
    select * into v_code from public.discount_codes
     where code = trim(p->>'discount_code') and is_active
       and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())
       and (usage_limit is null or used_count < usage_limit)
     for update;
    if not found or v_subtotal < v_code.min_subtotal then raise exception 'invalid_discount'; end if;
    if v_code.type = 'percent' then v_discount := round(v_subtotal * least(v_code.value, 100) / 100, 2);
    elsif v_code.type = 'fixed' then v_discount := least(v_code.value, v_subtotal);
    else v_shipping := 0; end if;
    update public.discount_codes set used_count = used_count + 1 where id = v_code.id;
  end if;

  -- customer (guest checkout creates / updates by email)
  insert into public.customers (email, name, phone, marketing_opt_in)
  values (v_email, trim(p->>'name'), trim(p->>'phone'), coalesce((p->>'marketing_opt_in')::boolean, false))
  on conflict (email) do update
    set name = excluded.name, phone = excluded.phone,
        marketing_opt_in = public.customers.marketing_opt_in or excluded.marketing_opt_in
  returning id into v_customer_id;

  insert into public.orders (customer_id, email, name, phone, shipping_address, locale,
                             subtotal, discount_total, shipping_total, total, discount_code,
                             reserved_until, customer_note)
  values (v_customer_id, v_email, trim(p->>'name'), trim(p->>'phone'), coalesce(p->'address', '{}'::jsonb),
          coalesce(p->>'locale', 'he'), v_subtotal, v_discount, v_shipping,
          v_subtotal - v_discount + v_shipping, nullif(trim(p->>'discount_code'), ''),
          now() + interval '30 minutes', coalesce(p->>'note', ''))
  returning id, order_number into v_order_id, v_order_number;

  insert into public.order_items (order_id, product_id, variant_id, name, size, color, sku, unit_price, quantity, line_total)
  select v_order_id, (l->>'product_id')::uuid, (l->>'variant_id')::uuid, l->>'name', l->>'size', l->>'color', l->>'sku',
         (l->>'unit_price')::numeric, (l->>'quantity')::int, (l->>'line_total')::numeric
    from jsonb_array_elements(v_lines) l;

  insert into public.order_events (order_id, type, data) values (v_order_id, 'created', jsonb_build_object('total', v_subtotal - v_discount + v_shipping));

  if coalesce((p->>'marketing_opt_in')::boolean, false) then
    insert into public.newsletter_subscribers (email, locale, source) values (v_email, coalesce(p->>'locale', 'he'), 'checkout')
    on conflict (email) do update set unsubscribed_at = null;
  end if;

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number,
    'subtotal', v_subtotal, 'discount', v_discount, 'shipping', v_shipping,
    'total', v_subtotal - v_discount + v_shipping, 'currency', 'ILS');
end $$;

-- Called only after the server has verified the payment with the provider.
create or replace function public.mark_order_paid(p_order_id uuid, p_provider text, p_ref text) returns text
language plpgsql security definer set search_path = '' as $$
declare v_status public.order_status;
begin
  select status into v_status from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_status = 'paid' then return 'already_paid'; end if;
  update public.orders set status = 'paid', paid_at = now(), payment_provider = p_provider, payment_ref = p_ref, reserved_until = null
   where id = p_order_id;
  insert into public.order_events (order_id, type, data)
  values (p_order_id, case when v_status = 'cancelled' then 'paid_after_expiry' else 'paid' end,
          jsonb_build_object('provider', p_provider, 'ref', p_ref, 'previous_status', v_status));
  return case when v_status = 'cancelled' then 'paid_after_expiry' else 'paid' end;
end $$;

-- Return stock from unpaid orders whose reservation expired.
create or replace function public.release_expired_orders() returns int
language plpgsql security definer set search_path = '' as $$
declare v_order record; v_count int := 0;
begin
  for v_order in
    select id from public.orders where status = 'pending_payment' and reserved_until < now() for update skip locked
  loop
    update public.product_variants v set stock = v.stock + oi.quantity
      from public.order_items oi where oi.order_id = v_order.id and oi.variant_id = v.id;
    update public.discount_codes d set used_count = greatest(used_count - 1, 0)
      from public.orders o where o.id = v_order.id and o.discount_code = d.code;
    update public.orders set status = 'cancelled', reserved_until = null where id = v_order.id;
    insert into public.order_events (order_id, type) values (v_order.id, 'reservation_expired');
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

-- lock functions down: only the server (service role) may call them
revoke execute on function public.place_order(jsonb) from public, anon, authenticated;
revoke execute on function public.mark_order_paid(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.release_expired_orders() from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;
grant execute on function public.mark_order_paid(uuid, text, text) to service_role;
grant execute on function public.release_expired_orders() to service_role;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- every 5 minutes, free stock held by abandoned checkouts
create extension if not exists pg_cron;
select cron.schedule('release-expired-orders', '*/5 * * * *', $$select public.release_expired_orders()$$);

-- product image storage: public read, admin write
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/webp', 'image/png', 'image/jpeg', 'image/avif'])
on conflict (id) do nothing;

create policy "admins upload product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "admins update product images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "admins delete product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
