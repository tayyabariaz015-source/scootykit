-- =====================================================================
-- ScootyKit — business functions
-- All money maths happens here, server-side, from database prices.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Rate limiting (fixed window). Called by server actions via service role.
-- ---------------------------------------------------------------------
create or replace function public.check_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits as rl (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case
                  when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1
                  else rl.count + 1
                end,
        window_start = case
                  when rl.window_start < now() - make_interval(secs => p_window_seconds) then now()
                  else rl.window_start
                end
  returning count into v_count;

  -- Opportunistic cleanup of stale keys
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_max;
end;
$$;

-- ---------------------------------------------------------------------
-- Delivery charge resolution: city → province → nationwide default.
-- Returns NULL when nothing is configured (checkout must refuse).
-- ---------------------------------------------------------------------
create or replace function public.resolve_delivery_charge(p_province text, p_city text, p_subtotal numeric)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_charge numeric(12,2);
  v_threshold numeric(12,2);
begin
  select free_delivery_threshold into v_threshold from public.store_settings where id = 1;
  if v_threshold is not null and p_subtotal >= v_threshold then
    return 0;
  end if;

  select charge into v_charge
  from public.delivery_zones
  where is_active
    and (
      (city is not null and lower(city) = lower(trim(p_city)) and lower(province) = lower(trim(p_province)))
      or (city is null and province is not null and lower(province) = lower(trim(p_province)))
      or (city is null and province is null)
    )
  order by (city is not null) desc, (province is not null) desc
  limit 1;

  return v_charge;
end;
$$;

-- ---------------------------------------------------------------------
-- Coupon evaluation (no side effects).
-- ---------------------------------------------------------------------
create or replace function public.evaluate_coupon(p_code text, p_subtotal numeric, p_phone text)
returns table (coupon_id uuid, code text, discount numeric, error text)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  c public.coupons%rowtype;
  v_discount numeric(12,2);
  v_customer_uses integer;
begin
  select * into c from public.coupons where public.coupons.code = upper(trim(p_code));
  if not found or not c.is_active then
    return query select null::uuid, null::text, 0::numeric, 'INVALID'::text; return;
  end if;
  if c.starts_at is not null and now() < c.starts_at then
    return query select null::uuid, null::text, 0::numeric, 'NOT_STARTED'::text; return;
  end if;
  if c.expires_at is not null and now() > c.expires_at then
    return query select null::uuid, null::text, 0::numeric, 'EXPIRED'::text; return;
  end if;
  if c.usage_limit is not null and c.times_used >= c.usage_limit then
    return query select null::uuid, null::text, 0::numeric, 'USAGE_LIMIT'::text; return;
  end if;
  if p_subtotal < c.min_order_amount then
    return query select null::uuid, null::text, c.min_order_amount, 'MIN_ORDER'::text; return;
  end if;
  if c.per_customer_limit is not null and p_phone is not null then
    select count(*) into v_customer_uses
    from public.coupon_redemptions r
    join public.orders o on o.id = r.order_id
    where r.coupon_id = c.id and r.phone = p_phone and o.status <> 'cancelled';
    if v_customer_uses >= c.per_customer_limit then
      return query select null::uuid, null::text, 0::numeric, 'CUSTOMER_LIMIT'::text; return;
    end if;
  end if;

  if c.discount_type = 'percent' then
    v_discount := round(p_subtotal * c.discount_value / 100, 0);
  else
    v_discount := c.discount_value;
  end if;
  if c.max_discount is not null then
    v_discount := least(v_discount, c.max_discount);
  end if;
  v_discount := least(v_discount, p_subtotal);

  return query select c.id, c.code, v_discount, null::text;
end;
$$;

-- ---------------------------------------------------------------------
-- Order number: SK-YYMMDD-XXXXX (unambiguous alphabet, Pakistan date)
-- ---------------------------------------------------------------------
create or replace function public.generate_order_number()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_suffix text;
  v_number text;
  i integer;
begin
  loop
    v_suffix := '';
    for i in 1..5 loop
      v_suffix := v_suffix || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    v_number := 'SK-' || to_char(now() at time zone 'Asia/Karachi', 'YYMMDD') || '-' || v_suffix;
    exit when not exists (select 1 from public.orders where order_number = v_number);
  end loop;
  return v_number;
end;
$$;

-- ---------------------------------------------------------------------
-- Atomic order creation. Everything (stock check, price lookup, delivery,
-- coupon, stock decrement) happens in ONE transaction. Frontend prices are ignored.
-- ---------------------------------------------------------------------
create or replace function public.create_order(
  p_idempotency_key text,
  p_user_id uuid,
  p_customer jsonb,
  p_items jsonb,
  p_payment_method text,
  p_coupon_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing      record;
  s               public.store_settings%rowtype;
  v_item          record;
  v_product       record;
  v_lines         jsonb := '[]'::jsonb;
  v_line          jsonb;
  v_unit          numeric(12,2);
  v_subtotal      numeric(12,2) := 0;
  v_delivery      numeric(12,2);
  v_discount      numeric(12,2) := 0;
  v_coupon        record;
  v_coupon_id     uuid;
  v_coupon_code   text;
  v_payment_status text;
  v_order_id      uuid;
  v_order_number  text;
  v_token         uuid;
  v_phone         text := p_customer ->> 'phone';
  v_province      text := trim(p_customer ->> 'province');
  v_city          text := trim(p_customer ->> 'city');
begin
  if p_idempotency_key is null or char_length(p_idempotency_key) < 16 then
    raise exception 'INVALID_REQUEST';
  end if;

  -- Serialise concurrent submissions of the same checkout attempt.
  perform pg_advisory_xact_lock(hashtext('order:' || p_idempotency_key));

  select order_number, access_token into v_existing
  from public.orders where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'order_number', v_existing.order_number,
      'access_token', v_existing.access_token,
      'duplicate', true
    );
  end if;

  select * into s from public.store_settings where id = 1;

  if p_payment_method = 'cod' then
    if not coalesce(s.cod_enabled, false) then raise exception 'PAYMENT_METHOD_DISABLED'; end if;
    v_payment_status := 'unpaid';
  elsif p_payment_method = 'bank_transfer' then
    if not coalesce(s.bank_transfer_enabled, false) then raise exception 'PAYMENT_METHOD_DISABLED'; end if;
    v_payment_status := 'awaiting_verification';
  else
    raise exception 'PAYMENT_METHOD_DISABLED';
  end if;

  if v_phone is null or v_phone !~ '^03[0-9]{9}$' then
    raise exception 'INVALID_PHONE';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'TOO_MANY_ITEMS';
  end if;

  -- Lock products in a stable order to avoid deadlocks.
  for v_item in
    select (e ->> 'product_id')::uuid as product_id,
           sum((e ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) e
    group by 1
    order by 1
  loop
    if v_item.quantity is null or v_item.quantity < 1 or v_item.quantity > 50 then
      raise exception 'INVALID_QUANTITY';
    end if;

    select p.id, p.name, p.slug, p.sku, p.price, p.sale_price, p.stock, p.status,
           (select pi.url from public.product_images pi
             where pi.product_id = p.id order by pi.sort_order, pi.created_at limit 1) as image_url
      into v_product
    from public.products p
    where p.id = v_item.product_id
    for update of p;

    if not found then
      raise exception 'PRODUCT_UNAVAILABLE:%', v_item.product_id::text;
    end if;
    if v_product.status <> 'active' or v_product.price <= 0 then
      raise exception 'PRODUCT_UNAVAILABLE:%', v_product.name;
    end if;
    if v_product.stock < v_item.quantity then
      raise exception 'OUT_OF_STOCK:%', v_product.name;
    end if;

    v_unit := coalesce(v_product.sale_price, v_product.price);
    v_subtotal := v_subtotal + v_unit * v_item.quantity;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'product_slug', v_product.slug,
      'sku', v_product.sku,
      'image_url', v_product.image_url,
      'unit_price', v_unit,
      'quantity', v_item.quantity,
      'line_total', v_unit * v_item.quantity
    );
  end loop;

  v_delivery := public.resolve_delivery_charge(v_province, v_city, v_subtotal);
  if v_delivery is null then
    raise exception 'DELIVERY_NOT_CONFIGURED';
  end if;

  if p_coupon_code is not null and trim(p_coupon_code) <> '' then
    -- Lock coupon row so usage limits hold under concurrency.
    perform 1 from public.coupons where code = upper(trim(p_coupon_code)) for update;
    select * into v_coupon from public.evaluate_coupon(p_coupon_code, v_subtotal, v_phone);
    if v_coupon.error is not null then
      raise exception 'COUPON_%', v_coupon.error;
    end if;
    v_coupon_id := v_coupon.coupon_id;
    v_coupon_code := v_coupon.code;
    v_discount := v_coupon.discount;
  end if;

  v_order_number := public.generate_order_number();

  insert into public.orders (
    order_number, idempotency_key, user_id,
    customer_name, phone, email, province, city, address, notes,
    payment_method, payment_status, status,
    subtotal, delivery_charge, discount, total,
    coupon_id, coupon_code
  ) values (
    v_order_number, p_idempotency_key, p_user_id,
    trim(p_customer ->> 'full_name'), v_phone, nullif(trim(p_customer ->> 'email'), ''),
    v_province, v_city, trim(p_customer ->> 'address'), nullif(trim(p_customer ->> 'notes'), ''),
    p_payment_method, v_payment_status, 'pending',
    v_subtotal, v_delivery, v_discount, greatest(v_subtotal - v_discount + v_delivery, 0),
    v_coupon_id, v_coupon_code
  )
  returning id, access_token into v_order_id, v_token;

  for v_line in select * from jsonb_array_elements(v_lines)
  loop
    insert into public.order_items (
      order_id, product_id, product_name, product_slug, sku, image_url, unit_price, quantity, line_total
    ) values (
      v_order_id,
      (v_line ->> 'product_id')::uuid,
      v_line ->> 'product_name',
      v_line ->> 'product_slug',
      v_line ->> 'sku',
      v_line ->> 'image_url',
      (v_line ->> 'unit_price')::numeric,
      (v_line ->> 'quantity')::integer,
      (v_line ->> 'line_total')::numeric
    );

    update public.products
       set stock = stock - (v_line ->> 'quantity')::integer,
           units_sold = units_sold + (v_line ->> 'quantity')::integer
     where id = (v_line ->> 'product_id')::uuid;
  end loop;

  if v_coupon_id is not null then
    insert into public.coupon_redemptions (coupon_id, order_id, phone, user_id, amount)
    values (v_coupon_id, v_order_id, v_phone, p_user_id, v_discount);
    update public.coupons set times_used = times_used + 1 where id = v_coupon_id;
  end if;

  insert into public.order_status_history (order_id, status, payment_status, note)
  values (v_order_id, 'pending', v_payment_status, 'Order placed');

  -- Signed-in customers: clear their server cart.
  if p_user_id is not null then
    delete from public.cart_items ci using public.carts c
     where ci.cart_id = c.id and c.user_id = p_user_id;
  end if;

  return jsonb_build_object(
    'order_number', v_order_number,
    'access_token', v_token,
    'duplicate', false
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Secure order tracking: requires order number AND the phone used at checkout.
-- Returns no street address.
-- ---------------------------------------------------------------------
create or replace function public.track_order(p_order_number text, p_phone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  o public.orders%rowtype;
begin
  select * into o from public.orders
  where order_number = upper(trim(p_order_number)) and phone = p_phone;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'order_number', o.order_number,
    'created_at', o.created_at,
    'status', o.status,
    'payment_status', o.payment_status,
    'payment_method', o.payment_method,
    'city', o.city,
    'total', o.total,
    'first_name', split_part(o.customer_name, ' ', 1),
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object('name', product_name, 'quantity', quantity) order by product_name), '[]'::jsonb)
      from public.order_items where order_id = o.id
    ),
    'history', (
      select coalesce(jsonb_agg(jsonb_build_object('status', status, 'created_at', created_at) order by created_at), '[]'::jsonb)
      from public.order_status_history where order_id = o.id
    )
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Admin: change order / payment status (restores stock on cancellation)
-- ---------------------------------------------------------------------
create or replace function public.admin_update_order(
  p_order_id uuid,
  p_status text,
  p_payment_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if p_status not in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') then
    raise exception 'INVALID_STATUS';
  end if;
  if p_payment_status not in ('unpaid', 'awaiting_verification', 'paid', 'refunded', 'failed') then
    raise exception 'INVALID_PAYMENT_STATUS';
  end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  if o.status = 'cancelled' and p_status <> 'cancelled' then
    raise exception 'ORDER_CANCELLED';
  end if;

  if p_status = 'cancelled' and not o.stock_restored then
    update public.products p
       set stock = p.stock + oi.quantity,
           units_sold = greatest(p.units_sold - oi.quantity, 0)
      from public.order_items oi
     where oi.order_id = o.id and oi.product_id = p.id;
    update public.coupons c set times_used = greatest(c.times_used - 1, 0)
     where c.id = o.coupon_id;
    update public.orders set stock_restored = true where id = o.id;
  end if;

  if o.status is distinct from p_status or o.payment_status is distinct from p_payment_status or p_note is not null then
    update public.orders
       set status = p_status, payment_status = p_payment_status
     where id = o.id;
    insert into public.order_status_history (order_id, status, payment_status, note, changed_by)
    values (o.id, p_status, p_payment_status, nullif(trim(p_note), ''), auth.uid());
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Admin: dashboard metrics (always real numbers, zero when empty)
-- "Sales" = non-cancelled orders that are paid or delivered.
-- ---------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  return jsonb_build_object(
    'total_orders',     (select count(*) from public.orders),
    'total_products',   (select count(*) from public.products where status <> 'archived'),
    'active_products',  (select count(*) from public.products where status = 'active'),
    'total_customers',  (select count(*) from public.profiles),
    'total_sales',      (select coalesce(sum(total), 0) from public.orders
                          where status <> 'cancelled' and (payment_status = 'paid' or status = 'delivered')),
    'pending_orders',   (select count(*) from public.orders where status = 'pending'),
    'completed_orders', (select count(*) from public.orders where status = 'delivered'),
    'cancelled_orders', (select count(*) from public.orders where status = 'cancelled'),
    'awaiting_payment', (select count(*) from public.orders where payment_status = 'awaiting_verification' and status <> 'cancelled'),
    'low_stock',        (select count(*) from public.products where status = 'active' and stock <= low_stock_threshold)
  );
end;
$$;

create or replace function public.admin_sales_series(p_days integer default 30)
returns table (day date, orders bigint, revenue numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  return query
  select d::date as day,
         count(o.id) as orders,
         coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0) as revenue
  from generate_series(
         (now() at time zone 'Asia/Karachi')::date - (greatest(p_days, 1) - 1),
         (now() at time zone 'Asia/Karachi')::date,
         interval '1 day'
       ) d
  left join public.orders o
    on (o.created_at at time zone 'Asia/Karachi')::date = d::date
  group by d
  order by d;
end;
$$;

-- ---------------------------------------------------------------------
-- Reviews: only customers with a delivered order containing the product.
-- ---------------------------------------------------------------------
create or replace function public.submit_review(
  p_product_id uuid,
  p_rating integer,
  p_title text,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
  v_name text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select o.id into v_order_id
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  where o.user_id = v_uid and o.status = 'delivered' and oi.product_id = p_product_id
  order by o.created_at desc
  limit 1;

  if v_order_id is null then
    raise exception 'NOT_VERIFIED_BUYER';
  end if;

  select coalesce(nullif(split_part(full_name, ' ', 1), ''), 'Customer') into v_name
  from public.profiles where id = v_uid;

  insert into public.reviews (product_id, user_id, order_id, author_name, rating, title, body)
  values (p_product_id, v_uid, v_order_id, coalesce(v_name, 'Customer'), p_rating, nullif(trim(p_title), ''), trim(p_body))
  on conflict (product_id, user_id) do update
    set rating = excluded.rating, title = excluded.title, body = excluded.body,
        is_approved = false, created_at = now();
end;
$$;

-- Approved review aggregates per product (real data only)
create or replace view public.product_rating_stats
with (security_invoker = true) as
select product_id, count(*)::integer as review_count, round(avg(rating)::numeric, 1) as average_rating
from public.reviews
where is_approved
group by product_id;

-- ---------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------
revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.evaluate_coupon(text, numeric, text) from public, anon, authenticated;
revoke all on function public.generate_order_number() from public, anon, authenticated;
revoke all on function public.create_order(text, uuid, jsonb, jsonb, text, text) from public, anon, authenticated;
revoke all on function public.track_order(text, text) from public, anon, authenticated;
revoke all on function public.admin_update_order(uuid, text, text, text) from public, anon;
revoke all on function public.admin_dashboard_stats() from public, anon;
revoke all on function public.admin_sales_series(integer) from public, anon;
revoke all on function public.submit_review(uuid, integer, text, text) from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;

grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
grant execute on function public.evaluate_coupon(text, numeric, text) to service_role;
grant execute on function public.generate_order_number() to service_role;
grant execute on function public.create_order(text, uuid, jsonb, jsonb, text, text) to service_role;
grant execute on function public.track_order(text, text) to service_role;
grant execute on function public.resolve_delivery_charge(text, text, numeric) to anon, authenticated, service_role;
grant execute on function public.admin_update_order(uuid, text, text, text) to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.admin_sales_series(integer) to authenticated;
grant execute on function public.submit_review(uuid, integer, text, text) to authenticated;
grant select on public.product_rating_stats to anon, authenticated;
