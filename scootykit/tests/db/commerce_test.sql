-- Database-level tests for ScootyKit commerce rules.
-- Run with tests/db/run.sh against a throwaway local PostgreSQL.
\set ON_ERROR_STOP 1

-- ---------- fixtures ----------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@example.com', '{"full_name":"Admin User"}'),
  ('00000000-0000-0000-0000-00000000000b', 'ayesha@example.com', '{"full_name":"Ayesha Khan","phone":"03001234567"}'),
  ('00000000-0000-0000-0000-00000000000c', 'other@example.com', '{"full_name":"Other User","phone":"bad"}');
insert into public.admin_users (user_id, role) values ('00000000-0000-0000-0000-00000000000a', 'owner');

insert into public.products (id, category_id, name, slug, sku, price, sale_price, stock, status) values
  ('10000000-0000-0000-0000-000000000001', (select id from categories where slug = 'scooty-helmets'), 'Test Helmet', 'test-helmet', 'SK-HEL-1', 3500, 2999, 5, 'active'),
  ('10000000-0000-0000-0000-000000000002', (select id from categories where slug = 'anti-theft-disc-locks'), 'Test Lock', 'test-lock', 'SK-LCK-1', 1200, null, 1, 'active'),
  ('10000000-0000-0000-0000-000000000003', (select id from categories where slug = 'gps-trackers'), 'Draft Tracker', 'draft-tracker', 'SK-GPS-1', 0, null, 0, 'draft');

insert into public.coupons (code, discount_type, discount_value, min_order_amount, usage_limit, per_customer_limit)
values ('WELCOME10', 'percent', 10, 1000, 100, 1);

do $$ begin
  assert (select phone from profiles where id = '00000000-0000-0000-0000-00000000000b') = '03001234567', 'profile phone saved';
  assert (select phone from profiles where id = '00000000-0000-0000-0000-00000000000c') is null, 'invalid phone dropped';
  assert (select published_at from products where slug = 'test-helmet') is not null, 'published_at set';
end $$;

-- active product must have a price
do $$ begin
  begin
    insert into products (name, slug, price, status) values ('Bad', 'bad-active', 0, 'active');
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  begin
    insert into products (name, slug, price, sale_price) values ('Bad2', 'bad-sale', 100, 150);
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
end $$;

-- ---------- order creation ----------
create temp table results (k text primary key, v jsonb);

insert into results values ('order1', public.create_order(
  'idem-key-0000000001', '00000000-0000-0000-0000-00000000000b',
  '{"full_name":"Ayesha Khan","phone":"03001234567","province":"Punjab","city":"Lahore","address":"House 12, Street 4, Model Town"}',
  '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1},{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]',
  'cod', 'welcome10'));

do $$
declare o record;
begin
  select * into o from orders where order_number = (select v->>'order_number' from results where k='order1');
  assert o.subtotal = 5998, format('subtotal from DB sale price, got %s', o.subtotal);
  assert o.discount = 600, format('10%% coupon rounded, got %s', o.discount);
  assert o.delivery_charge = 250, 'default delivery zone';
  assert o.total = 5998 - 600 + 250, 'total';
  assert o.payment_status = 'unpaid', 'COD unpaid';
  assert o.order_number ~ '^SK-[0-9]{6}-[A-Z0-9]{5}$', 'order number format';
  assert (select stock from products where slug='test-helmet') = 3, 'stock decremented (duplicate lines merged)';
  assert (select units_sold from products where slug='test-helmet') = 2, 'units_sold incremented';
  assert (select times_used from coupons where code='WELCOME10') = 1, 'coupon used';
  assert (select count(*) from order_items where order_id = o.id) = 1, 'merged into one line';
  assert (select unit_price from order_items where order_id = o.id) = 2999, 'price snapshot';
end $$;

-- idempotency: same key returns same order, no second stock decrement
insert into results values ('order1b', public.create_order(
  'idem-key-0000000001', null,
  '{"full_name":"Ayesha Khan","phone":"03001234567","province":"Punjab","city":"Lahore","address":"House 12, Street 4, Model Town"}',
  '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]', 'cod', null));
do $$ begin
  assert (select v->>'order_number' from results where k='order1b') = (select v->>'order_number' from results where k='order1'), 'idempotent';
  assert (select (v->>'duplicate')::boolean from results where k='order1b'), 'flagged duplicate';
  assert (select stock from products where slug='test-helmet') = 3, 'no double decrement';
end $$;

-- per-customer coupon limit
do $$ begin
  perform public.create_order('idem-key-0000000002', null,
    '{"full_name":"Ayesha Khan","phone":"03001234567","province":"Punjab","city":"Lahore","address":"House 12, Street 4, Model Town"}',
    '[{"product_id":"10000000-0000-0000-0000-000000000001","quantity":1}]', 'cod', 'WELCOME10');
  raise exception 'should fail';
exception when others then
  assert sqlerrm = 'COUPON_CUSTOMER_LIMIT', sqlerrm;
end $$;

-- out of stock
do $$ begin
  perform public.create_order('idem-key-0000000003', null,
    '{"full_name":"Bilal","phone":"03111111111","province":"Sindh","city":"Karachi","address":"Flat 3, Block 2, Gulshan"}',
    '[{"product_id":"10000000-0000-0000-0000-000000000002","quantity":2}]', 'cod', null);
  raise exception 'should fail';
exception when others then
  assert sqlerrm = 'OUT_OF_STOCK:Test Lock', sqlerrm;
end $$;
do $$ begin assert (select stock from products where slug='test-lock') = 1, 'rollback kept stock'; end $$;

-- draft product cannot be ordered
do $$ begin
  perform public.create_order('idem-key-0000000004', null,
    '{"full_name":"Bilal","phone":"03111111111","province":"Sindh","city":"Karachi","address":"Flat 3, Block 2, Gulshan"}',
    '[{"product_id":"10000000-0000-0000-0000-000000000003","quantity":1}]', 'cod', null);
  raise exception 'should fail';
exception when others then
  assert sqlerrm like 'PRODUCT_UNAVAILABLE:%', sqlerrm;
end $$;

-- invalid phone
do $$ begin
  perform public.create_order('idem-key-0000000005', null,
    '{"full_name":"Bilal","phone":"+923111111111","province":"Sindh","city":"Karachi","address":"Flat 3, Block 2, Gulshan"}',
    '[{"product_id":"10000000-0000-0000-0000-000000000002","quantity":1}]', 'cod', null);
  raise exception 'should fail';
exception when others then
  assert sqlerrm = 'INVALID_PHONE', sqlerrm;
end $$;

-- bank transfer disabled by default
do $$ begin
  perform public.create_order('idem-key-0000000006', null,
    '{"full_name":"Bilal","phone":"03111111111","province":"Sindh","city":"Karachi","address":"Flat 3, Block 2, Gulshan"}',
    '[{"product_id":"10000000-0000-0000-0000-000000000002","quantity":1}]', 'bank_transfer', null);
  raise exception 'should fail';
exception when others then
  assert sqlerrm = 'PAYMENT_METHOD_DISABLED', sqlerrm;
end $$;

-- city-specific zone beats default; bank transfer → awaiting verification
update store_settings set bank_transfer_enabled = true where id = 1;
insert into delivery_zones (name, province, city, charge) values ('Karachi', 'Sindh', 'Karachi', 150);
insert into results values ('order2', public.create_order('idem-key-0000000007', null,
    '{"full_name":"Bilal Ahmed","phone":"03111111111","province":"Sindh","city":"karachi","address":"Flat 3, Block 2, Gulshan"}',
    '[{"product_id":"10000000-0000-0000-0000-000000000002","quantity":1}]', 'bank_transfer', null));
do $$
declare o record;
begin
  select * into o from orders where order_number = (select v->>'order_number' from results where k='order2');
  assert o.delivery_charge = 150, 'city zone';
  assert o.payment_status = 'awaiting_verification', 'bank transfer awaiting verification';
  assert (select stock from products where slug='test-lock') = 0, 'stock now 0';
end $$;

-- free delivery threshold
update store_settings set free_delivery_threshold = 5000 where id = 1;
do $$ begin
  assert public.resolve_delivery_charge('Punjab', 'Lahore', 5000) = 0, 'free over threshold';
  assert public.resolve_delivery_charge('Punjab', 'Lahore', 4999) = 250, 'charged under threshold';
end $$;
update store_settings set free_delivery_threshold = null where id = 1;

-- tracking requires matching phone
do $$
declare n text := (select v->>'order_number' from results where k='order2');
begin
  assert public.track_order(n, '03111111111') is not null, 'tracking with right phone';
  assert public.track_order(n, '03009999999') is null, 'tracking with wrong phone blocked';
  assert public.track_order(lower(n), '03111111111') ? 'history', 'case-insensitive order number';
  assert not (public.track_order(n, '03111111111') ? 'address'), 'no address in tracking';
end $$;

-- rate limiter
do $$
declare i int; ok boolean;
begin
  for i in 1..3 loop ok := public.check_rate_limit('test:ip', 3, 60); assert ok, 'within limit'; end loop;
  assert not public.check_rate_limit('test:ip', 3, 60), 'over limit';
end $$;

-- ---------- RLS ----------
set role anon;
do $$ begin
  assert (select count(*) from products) = 2, 'anon sees only active products';
  assert (select count(*) from orders) = 0, 'anon sees no orders';
  assert (select count(*) from coupons) = 0, 'anon sees no coupons';
  assert (select count(*) from product_sourcing) = 0, 'anon sees no sourcing';
end $$;
do $$ begin
  perform public.create_order('idem-key-0000000008', null, '{}', '[]', 'cod', null);
  raise exception 'should fail';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  update products set price = 1 where slug = 'test-helmet';
  assert (select price from products where slug = 'test-helmet') = 3500, 'anon cannot change price';
end $$;
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  assert (select count(*) from orders) = 1, 'customer sees own order only';
  assert (select count(*) from order_items) = 1, 'customer sees own items only';
  assert not public.is_admin(), 'customer is not admin';
end $$;
do $$ begin
  perform public.admin_update_order((select id from orders limit 1), 'delivered', 'paid', null);
  raise exception 'should fail';
exception when others then assert sqlerrm = 'FORBIDDEN', sqlerrm;
end $$;
do $$ begin
  update orders set total = 1;
  assert (select total from orders limit 1) <> 1, 'customer cannot edit order';
  insert into admin_users (user_id) values ('00000000-0000-0000-0000-00000000000b');
  raise exception 'should fail';
exception when insufficient_privilege then null;
end $$;
-- review needs a delivered order
do $$ begin
  perform public.submit_review('10000000-0000-0000-0000-000000000001', 5, 'Great', 'Really comfortable helmet.');
  raise exception 'should fail';
exception when others then assert sqlerrm = 'NOT_VERIFIED_BUYER', sqlerrm;
end $$;
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$ begin
  assert (select count(*) from orders) = 0, 'other user sees nothing';
end $$;
reset role;

-- ---------- admin ----------
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$
declare s jsonb;
begin
  assert public.is_admin(), 'admin recognised';
  assert (select count(*) from orders) = 2, 'admin sees all orders';
  assert (select count(*) from products) = 3, 'admin sees drafts';
  s := public.admin_dashboard_stats();
  assert (s->>'total_orders')::int = 2, 'stats orders';
  assert (s->>'pending_orders')::int = 2, 'stats pending';
  assert (s->>'total_sales')::numeric = 0, 'no paid/delivered sales yet';
  assert (s->>'low_stock')::int = 2, 'low stock count';
end $$;

-- deliver order1 → verified buyer can review
do $$ begin
  perform public.admin_update_order((select id from orders where user_id = '00000000-0000-0000-0000-00000000000b'), 'delivered', 'paid', 'Delivered by courier');
  assert (public.admin_dashboard_stats()->>'total_sales')::numeric = 5648, 'sales after delivery';
end $$;

-- cancel order2 → stock restored once
do $$
declare oid uuid := (select id from orders where phone = '03111111111');
begin
  perform public.admin_update_order(oid, 'cancelled', 'failed', 'Customer cancelled');
  perform public.admin_update_order(oid, 'cancelled', 'failed', null);
  assert (select stock from products where slug='test-lock') = 1, 'stock restored exactly once';
  assert (select units_sold from products where slug='test-lock') = 0, 'units_sold reverted';
  begin
    perform public.admin_update_order(oid, 'pending', 'unpaid', null);
    raise exception 'should fail';
  exception when others then assert sqlerrm = 'ORDER_CANCELLED', sqlerrm;
  end;
  assert (select count(*) from order_status_history where order_id = oid) = 2, 'history rows';
  assert (select count(*) from admin_sales_series(7)) = 7, 'sales series days';
end $$;
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  perform public.submit_review('10000000-0000-0000-0000-000000000001', 5, 'Great', 'Really comfortable helmet.');
end $$;
reset role;
reset request.jwt.claim.sub;
set role anon;
do $$ begin
  assert (select count(*) from reviews) = 0, 'unapproved review hidden';
end $$;
reset role;

select 'ALL DATABASE TESTS PASSED' as result;
