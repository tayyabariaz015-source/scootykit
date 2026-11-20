-- =====================================================================
-- ScootyKit — core schema
-- Money is stored as numeric(12,2) in PKR. Never use float for money.
-- =====================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. Categories
-- ---------------------------------------------------------------------
create table public.categories (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 2 and 80),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description      text not null default '' check (char_length(description) <= 1000),
  image_url        text,
  icon             text not null default 'package',
  sort_order       integer not null default 0,
  is_visible       boolean not null default true,
  seo_title        text check (char_length(seo_title) <= 70),
  seo_description  text check (char_length(seo_description) <= 170),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index categories_visible_sort_idx on public.categories (is_visible, sort_order);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. Products
-- ---------------------------------------------------------------------
create table public.products (
  id                   uuid primary key default gen_random_uuid(),
  category_id          uuid references public.categories(id) on delete set null,
  name                 text not null check (char_length(name) between 2 and 160),
  slug                 text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku                  text unique check (sku is null or char_length(sku) between 1 and 64),
  short_description    text not null default '' check (char_length(short_description) <= 300),
  description          text not null default '' check (char_length(description) <= 10000),
  features             text[] not null default '{}',
  price                numeric(12,2) not null default 0 check (price >= 0),
  sale_price           numeric(12,2) check (sale_price is null or sale_price >= 0),
  -- What the customer actually pays; used for price filters/sorting.
  effective_price      numeric(12,2) generated always as (coalesce(sale_price, price)) stored,
  stock                integer not null default 0 check (stock >= 0),
  low_stock_threshold  integer not null default 5 check (low_stock_threshold >= 0),
  status               text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  is_featured          boolean not null default false,
  -- Real units sold in non-cancelled orders. Maintained only by order functions.
  units_sold           integer not null default 0 check (units_sold >= 0),
  seo_title            text check (char_length(seo_title) <= 70),
  seo_description      text check (char_length(seo_description) <= 170),
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint products_sale_below_price check (sale_price is null or sale_price < price),
  -- An active product must have a real selling price.
  constraint products_active_has_price check (status <> 'active' or price > 0)
);
create index products_category_idx on public.products (category_id);
create index products_status_created_idx on public.products (status, created_at desc);
create index products_featured_idx on public.products (is_featured) where is_featured;
create index products_units_sold_idx on public.products (units_sold desc);
create index products_effective_price_idx on public.products (effective_price);
create index products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create or replace function public.products_set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'active' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;
create trigger products_published_at before insert or update on public.products
  for each row execute function public.products_set_published_at();

-- ---------------------------------------------------------------------
-- 3. Product images
-- ---------------------------------------------------------------------
create table public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  url           text not null,
  storage_path  text,
  alt           text not null default '',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

-- ---------------------------------------------------------------------
-- 4. Product specifications
-- ---------------------------------------------------------------------
create table public.product_specifications (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  label       text not null check (char_length(label) between 1 and 80),
  value       text not null check (char_length(value) between 1 and 300),
  sort_order  integer not null default 0
);
create index product_specs_product_idx on public.product_specifications (product_id, sort_order);

-- Private sourcing data (cost price, supplier links). Admin-only via RLS.
create table public.product_sourcing (
  product_id           uuid primary key references public.products(id) on delete cascade,
  supplier_name        text,
  supplier_url         text,
  supplier_image_urls  text[] not null default '{}',
  cost_price           numeric(12,2) check (cost_price is null or cost_price >= 0),
  notes                text,
  imported_at          timestamptz,
  updated_at           timestamptz not null default now()
);
create trigger product_sourcing_updated_at before update on public.product_sourcing
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. Customer profiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 120),
  phone       text check (phone is null or phone ~ '^03[0-9]{9}$'),
  email       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := nullif(new.raw_user_meta_data ->> 'phone', '');
begin
  if v_phone is not null and v_phone !~ '^03[0-9]{9}$' then
    v_phone := null;
  end if;
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(left(new.raw_user_meta_data ->> 'full_name', 120), ''),
    v_phone,
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 6. Addresses
-- ---------------------------------------------------------------------
create table public.addresses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  label         text not null default 'Home' check (char_length(label) <= 40),
  full_name     text not null check (char_length(full_name) between 2 and 120),
  phone         text not null check (phone ~ '^03[0-9]{9}$'),
  province      text not null,
  city          text not null check (char_length(city) between 2 and 80),
  address_line  text not null check (char_length(address_line) between 8 and 400),
  is_default    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);
create unique index addresses_one_default_idx on public.addresses (user_id) where is_default;
create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 15. Admin users / roles
-- Rows are inserted manually (SQL editor) — never from the app.
-- ---------------------------------------------------------------------
create table public.admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'admin' check (role in ('owner', 'admin', 'staff')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 16. Store settings (single row)
-- ---------------------------------------------------------------------
create table public.store_settings (
  id                        integer primary key default 1 check (id = 1),
  store_name                text not null default 'ScootyKit',
  tagline                   text not null default 'Everything Your Scooty Needs.',
  announcement_text         text check (char_length(announcement_text) <= 160),
  announcement_link         text,
  announcement_active       boolean not null default false,
  contact_email             text,
  contact_phone             text,
  whatsapp_number           text,
  business_address          text,
  business_hours            text,
  -- Bank transfer details shown at checkout once configured.
  bank_transfer_enabled     boolean not null default false,
  bank_name                 text,
  bank_account_title        text,
  bank_account_number       text,
  bank_iban                 text,
  bank_instructions         text,
  cod_enabled               boolean not null default true,
  -- Delivery: null threshold = no free-delivery offer.
  free_delivery_threshold   numeric(12,2) check (free_delivery_threshold is null or free_delivery_threshold > 0),
  delivery_estimate_text    text,
  hero_image_url            text,
  social_facebook           text,
  social_instagram          text,
  social_tiktok             text,
  updated_at                timestamptz not null default now()
);
create trigger store_settings_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 17. Delivery zones / charges
-- Resolution order: city match → province match → nationwide default.
-- ---------------------------------------------------------------------
create table public.delivery_zones (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 80),
  province    text,
  city        text,
  charge      numeric(12,2) not null check (charge >= 0),
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint delivery_zone_city_needs_province check (city is null or province is not null)
);
create unique index delivery_zones_scope_idx
  on public.delivery_zones (coalesce(lower(province), ''), coalesce(lower(city), ''));
create trigger delivery_zones_updated_at before update on public.delivery_zones
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 13. Coupons
-- ---------------------------------------------------------------------
create table public.coupons (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique check (code ~ '^[A-Z0-9_-]{3,32}$'),
  description         text,
  discount_type       text not null check (discount_type in ('percent', 'fixed')),
  discount_value      numeric(12,2) not null check (discount_value > 0),
  min_order_amount    numeric(12,2) not null default 0 check (min_order_amount >= 0),
  max_discount        numeric(12,2) check (max_discount is null or max_discount > 0),
  starts_at           timestamptz,
  expires_at          timestamptz,
  usage_limit         integer check (usage_limit is null or usage_limit > 0),
  per_customer_limit  integer check (per_customer_limit is null or per_customer_limit > 0),
  times_used          integer not null default 0 check (times_used >= 0),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint coupons_percent_range check (discount_type <> 'percent' or discount_value <= 100),
  constraint coupons_dates check (starts_at is null or expires_at is null or starts_at < expires_at)
);
create trigger coupons_updated_at before update on public.coupons
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 7. Orders
-- ---------------------------------------------------------------------
create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique,
  -- Secret used in the confirmation URL. Knowing the order number alone is not enough.
  access_token       uuid not null default gen_random_uuid(),
  idempotency_key    text not null unique check (char_length(idempotency_key) between 16 and 100),
  user_id            uuid references auth.users(id) on delete set null,
  customer_name      text not null check (char_length(customer_name) between 2 and 120),
  phone              text not null check (phone ~ '^03[0-9]{9}$'),
  email              text,
  province           text not null,
  city               text not null,
  address            text not null check (char_length(address) between 8 and 400),
  notes              text check (char_length(notes) <= 500),
  payment_method     text not null check (payment_method in ('cod', 'bank_transfer')),
  payment_status     text not null check (payment_status in ('unpaid', 'awaiting_verification', 'paid', 'refunded', 'failed')),
  payment_reference  text check (char_length(payment_reference) <= 120),
  status             text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal           numeric(12,2) not null check (subtotal >= 0),
  delivery_charge    numeric(12,2) not null check (delivery_charge >= 0),
  discount           numeric(12,2) not null default 0 check (discount >= 0),
  total              numeric(12,2) not null check (total >= 0),
  coupon_id          uuid references public.coupons(id) on delete set null,
  coupon_code        text,
  stock_restored     boolean not null default false,
  admin_notes        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_phone_idx on public.orders (phone);
create index orders_created_idx on public.orders (created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 8. Order items — price snapshots survive product edits/deletes
-- ---------------------------------------------------------------------
create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  product_name  text not null,
  product_slug  text,
  sku           text,
  image_url     text,
  unit_price    numeric(12,2) not null check (unit_price >= 0),
  quantity      integer not null check (quantity > 0),
  line_total    numeric(12,2) not null check (line_total >= 0)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------
-- 19. Order status history
-- ---------------------------------------------------------------------
create table public.order_status_history (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  status          text not null,
  payment_status  text not null,
  note            text,
  changed_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- ---------------------------------------------------------------------
-- 14. Coupon redemptions
-- ---------------------------------------------------------------------
create table public.coupon_redemptions (
  id          uuid primary key default gen_random_uuid(),
  coupon_id   uuid not null references public.coupons(id) on delete cascade,
  order_id    uuid not null unique references public.orders(id) on delete cascade,
  phone       text not null,
  user_id     uuid references auth.users(id) on delete set null,
  amount      numeric(12,2) not null check (amount >= 0),
  created_at  timestamptz not null default now()
);
create index coupon_redemptions_coupon_phone_idx on public.coupon_redemptions (coupon_id, phone);

-- ---------------------------------------------------------------------
-- 9–10. Carts (authenticated users; guests use localStorage)
-- ---------------------------------------------------------------------
create table public.carts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger carts_updated_at before update on public.carts
  for each row execute function public.set_updated_at();

create table public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  cart_id     uuid not null references public.carts(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  quantity    integer not null check (quantity between 1 and 50),
  created_at  timestamptz not null default now(),
  unique (cart_id, product_id)
);

-- ---------------------------------------------------------------------
-- 11. Wishlists
-- ---------------------------------------------------------------------
create table public.wishlists (
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------------------------------------------------------------------
-- 12. Reviews — verified buyers only, published after admin approval
-- ---------------------------------------------------------------------
create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null,
  order_id     uuid references public.orders(id) on delete set null,
  author_name  text not null check (char_length(author_name) between 2 and 80),
  rating       smallint not null check (rating between 1 and 5),
  title        text check (char_length(title) <= 120),
  body         text not null check (char_length(body) between 10 and 2000),
  is_approved  boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (product_id, user_id)
);
create index reviews_product_approved_idx on public.reviews (product_id, is_approved, created_at desc);

-- ---------------------------------------------------------------------
-- 18. Newsletter subscribers
-- ---------------------------------------------------------------------
create table public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  status      text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  source      text,
  created_at  timestamptz not null default now()
);

-- Contact form messages
create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 120),
  email       text,
  phone       text,
  subject     text check (char_length(subject) <= 160),
  message     text not null check (char_length(message) between 10 and 3000),
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Fixed-window rate limiting (used by server actions via service role)
create table public.rate_limits (
  key           text primary key,
  window_start  timestamptz not null default now(),
  count         integer not null default 0
);
