-- Admin order actions. Callable by signed-in users, but each one checks private.is_admin() first.

-- Move an order through its workflow. Clears the stock reservation once paid so the
-- 5-minute cleanup never cancels a paid order, stamps paid_at, and logs the change.
create or replace function public.admin_set_order_status(p_order_id uuid, p_status public.order_status, p_note text default '')
returns public.order_status
language plpgsql security definer set search_path = '' as $$
declare v_old public.order_status;
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  if p_status = 'cancelled' then
    perform public.admin_cancel_order(p_order_id, p_note);
    return 'cancelled';
  end if;
  select status into v_old from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_old = 'cancelled' then raise exception 'order_cancelled'; end if;
  update public.orders
     set status = p_status,
         reserved_until = case when p_status = 'pending_payment' then reserved_until else null end,
         paid_at = case when p_status <> 'pending_payment' and paid_at is null then now() else paid_at end
   where id = p_order_id;
  insert into public.order_events (order_id, type, data, created_by)
  values (p_order_id, 'status_changed', jsonb_build_object('from', v_old, 'to', p_status, 'note', p_note), auth.uid());
  return p_status;
end $$;

-- Cancel an order and put its items back in stock (once).
create or replace function public.admin_cancel_order(p_order_id uuid, p_note text default '')
returns void
language plpgsql security definer set search_path = '' as $$
declare v_old public.order_status;
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  select status into v_old from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_old = 'cancelled' then return; end if;
  update public.product_variants v set stock = v.stock + oi.quantity
    from public.order_items oi where oi.order_id = p_order_id and oi.variant_id = v.id;
  update public.orders set status = 'cancelled', reserved_until = null where id = p_order_id;
  insert into public.order_events (order_id, type, data, created_by)
  values (p_order_id, 'cancelled', jsonb_build_object('from', v_old, 'note', p_note, 'restocked', true), auth.uid());
end $$;

revoke execute on function public.admin_set_order_status(uuid, public.order_status, text) from public, anon;
revoke execute on function public.admin_cancel_order(uuid, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, public.order_status, text) to authenticated;
grant execute on function public.admin_cancel_order(uuid, text) to authenticated;

-- Run with the caller's rights: row-level security already limits every write here to admins.
alter function public.admin_set_order_status(uuid, public.order_status, text) security invoker;
alter function public.admin_cancel_order(uuid, text) security invoker;
