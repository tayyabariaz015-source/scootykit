-- =====================================================================
-- ScootyKit — Row Level Security, roles and storage
-- =====================================================================

-- Admin check used by every policy. SECURITY DEFINER so it can read admin_users
-- even though normal users have no access to that table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- Enable RLS everywhere
alter table public.categories             enable row level security;
alter table public.products               enable row level security;
alter table public.product_images         enable row level security;
alter table public.product_specifications enable row level security;
alter table public.product_sourcing       enable row level security;
alter table public.profiles               enable row level security;
alter table public.addresses              enable row level security;
alter table public.admin_users            enable row level security;
alter table public.store_settings         enable row level security;
alter table public.delivery_zones         enable row level security;
alter table public.coupons                enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.order_status_history   enable row level security;
alter table public.coupon_redemptions     enable row level security;
alter table public.carts                  enable row level security;
alter table public.cart_items             enable row level security;
alter table public.wishlists              enable row level security;
alter table public.reviews                enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages       enable row level security;
alter table public.rate_limits            enable row level security;

-- ---------------- Catalog (public read of published data) ----------------
create policy "categories: public read visible" on public.categories
  for select using (is_visible or public.is_admin());
create policy "categories: admin write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "products: public read active" on public.products
  for select using (status = 'active' or public.is_admin());
create policy "products: admin write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "product_images: public read" on public.product_images
  for select using (
    public.is_admin() or exists (
      select 1 from public.products p where p.id = product_id and p.status = 'active'
    )
  );
create policy "product_images: admin write" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

create policy "product_specs: public read" on public.product_specifications
  for select using (
    public.is_admin() or exists (
      select 1 from public.products p where p.id = product_id and p.status = 'active'
    )
  );
create policy "product_specs: admin write" on public.product_specifications
  for all using (public.is_admin()) with check (public.is_admin());

create policy "product_sourcing: admin only" on public.product_sourcing
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- Customers ----------------
create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "addresses: own" on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "addresses: admin read" on public.addresses
  for select using (public.is_admin());

create policy "admin_users: read own" on public.admin_users
  for select using (user_id = auth.uid());
-- No insert/update/delete policies: admin roles are managed in SQL only.

-- ---------------- Settings ----------------
create policy "store_settings: public read" on public.store_settings
  for select using (true);
create policy "store_settings: admin update" on public.store_settings
  for update using (public.is_admin()) with check (public.is_admin());

create policy "delivery_zones: public read active" on public.delivery_zones
  for select using (is_active or public.is_admin());
create policy "delivery_zones: admin write" on public.delivery_zones
  for all using (public.is_admin()) with check (public.is_admin());

create policy "coupons: admin only" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());
create policy "coupon_redemptions: admin read" on public.coupon_redemptions
  for select using (public.is_admin());

-- ---------------- Orders ----------------
-- Orders are created ONLY through public.create_order() (service role).
-- Customers can read their own; admins read everything and change status via functions.
create policy "orders: read own or admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "orders: admin update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

create policy "order_items: read via order" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "order_status_history: read via order" on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- ---------------- Carts & wishlists ----------------
create policy "carts: own" on public.carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cart_items: own" on public.cart_items
  for all using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );

create policy "wishlists: own" on public.wishlists
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------- Reviews ----------------
create policy "reviews: read approved, own, or admin" on public.reviews
  for select using (is_approved or user_id = auth.uid() or public.is_admin());
create policy "reviews: admin update" on public.reviews
  for update using (public.is_admin()) with check (public.is_admin());
create policy "reviews: admin delete" on public.reviews
  for delete using (public.is_admin());
-- Inserts go through public.submit_review() which verifies a delivered purchase.

-- ---------------- Newsletter / contact ----------------
create policy "newsletter: admin manage" on public.newsletter_subscribers
  for all using (public.is_admin()) with check (public.is_admin());
create policy "contact_messages: admin manage" on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());

-- rate_limits: no policies → only service_role can touch it.

-- =====================================================================
-- Storage: public product/category images, admin-only writes,
-- 5 MB limit and image MIME types enforced by the bucket itself.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "product-images: public read" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "product-images: admin insert" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "product-images: admin update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());
create policy "product-images: admin delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());
