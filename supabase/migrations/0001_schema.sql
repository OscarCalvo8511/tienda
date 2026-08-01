-- ============================================================
--  0001_schema.sql — Esquema relacional de la tienda
--  PostgreSQL / Supabase
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------- ENUMS ----------
do $$ begin
  create type user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_status as enum ('available', 'out_of_stock', 'coming_soon');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum
    ('pending','paid','preparing','shipped','delivered','cancelled','returned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending','approved','failed','refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_provider as enum ('stripe','mercadopago','paypal','wompi','payu','manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inventory_movement_type as enum ('in','out','adjustment','sale','return');
exception when duplicate_object then null; end $$;

do $$ begin
  create type coupon_type as enum ('percentage','fixed','free_shipping');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum
    ('welcome','order_created','payment_approved','order_shipped','order_delivered','password_reset','low_stock');
exception when duplicate_object then null; end $$;

-- ---------- utilidades ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================
--  PERFILES / RBAC
--  (auth.users lo gestiona Supabase; profiles lo extiende 1:1)
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        citext,
  full_name    text,
  phone        text,
  avatar_url   text,
  role         user_role not null default 'customer',
  is_blocked   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_profiles_role on public.profiles(role);
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
--  CATEGORÍAS (auto-referenciada: padre / hija)
-- ============================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  parent_id   uuid references public.categories(id) on delete set null,
  position    int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_categories_parent on public.categories(parent_id);
create index if not exists idx_categories_active on public.categories(is_active);

-- ============================================================
--  PRODUCTOS
-- ============================================================
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  sku               text unique,
  barcode           text,
  brand             text,
  supplier          text,
  short_description text,
  description       text,
  specifications    jsonb not null default '{}'::jsonb,
  price             numeric(12,2) not null check (price >= 0),
  sale_price        numeric(12,2) check (sale_price >= 0),
  cost              numeric(12,2) check (cost >= 0),
  currency          text not null default 'COP',
  weight_grams      numeric(10,2),
  length_cm         numeric(10,2),
  width_cm          numeric(10,2),
  height_cm         numeric(10,2),
  status            product_status not null default 'available',
  is_active         boolean not null default true,
  is_featured       boolean not null default false,
  category_id       uuid references public.categories(id) on delete set null,
  video_url         text,
  rating_avg        numeric(3,2) not null default 0,
  rating_count      int not null default 0,
  sold_count        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint sale_lt_price check (sale_price is null or sale_price <= price)
);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(is_active);
create index if not exists idx_products_featured on public.products(is_featured);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_created on public.products(created_at desc);
create index if not exists idx_products_name_trgm on public.products using gin (to_tsvector('spanish', coalesce(name,'') || ' ' || coalesce(short_description,'')));
drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();

create table if not exists public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url        text not null,
  alt        text,
  is_primary boolean not null default false,
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_images_product on public.product_images(product_id);
create unique index if not exists uniq_primary_image
  on public.product_images(product_id) where is_primary;

create table if not exists public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  name        text not null,
  sku         text unique,
  price       numeric(12,2) check (price >= 0),
  attributes  jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_variants_product on public.product_variants(product_id);

-- ============================================================
--  INVENTARIO + MOVIMIENTOS
-- ============================================================
create table if not exists public.inventory (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.products(id) on delete cascade,
  variant_id          uuid references public.product_variants(id) on delete cascade,
  quantity            int not null default 0 check (quantity >= 0),
  low_stock_threshold int not null default 5,
  updated_at          timestamptz not null default now(),
  unique (product_id, variant_id)
);
create index if not exists idx_inventory_product on public.inventory(product_id);
drop trigger if exists trg_inventory_updated on public.inventory;
create trigger trg_inventory_updated before update on public.inventory
  for each row execute function public.set_updated_at();

create table if not exists public.inventory_movements (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  variant_id   uuid references public.product_variants(id) on delete set null,
  type         inventory_movement_type not null,
  quantity     int not null,            -- positivo entra, negativo sale
  previous_qty int,
  new_qty      int,
  reason       text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_movements_product on public.inventory_movements(product_id);
create index if not exists idx_movements_created on public.inventory_movements(created_at desc);

-- ============================================================
--  DIRECCIONES
-- ============================================================
create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  full_name   text not null,
  phone       text not null,
  line1       text not null,
  line2       text,
  city        text not null,
  department  text not null,            -- Departamento (Colombia)
  country     text not null default 'Colombia',
  postal_code text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_addresses_user on public.addresses(user_id);

-- ============================================================
--  CARRITO
-- ============================================================
create table if not exists public.carts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade,
  session_id text,                       -- carrito de invitado
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uniq_cart_user on public.carts(user_id) where user_id is not null;
create index if not exists idx_carts_session on public.carts(session_id);
drop trigger if exists trg_carts_updated on public.carts;
create trigger trg_carts_updated before update on public.carts
  for each row execute function public.set_updated_at();

create table if not exists public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity   int not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null,
  created_at timestamptz not null default now(),
  unique (cart_id, product_id, variant_id)
);
create index if not exists idx_cart_items_cart on public.cart_items(cart_id);

-- ============================================================
--  LISTA DE DESEOS
-- ============================================================
create table if not exists public.wishlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade unique,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  id          uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (wishlist_id, product_id)
);
create index if not exists idx_wishlist_items_wishlist on public.wishlist_items(wishlist_id);

-- ============================================================
--  CUPONES
-- ============================================================
create table if not exists public.coupons (
  id                 uuid primary key default gen_random_uuid(),
  code               citext not null unique,
  description        text,
  type               coupon_type not null,
  value              numeric(12,2) not null default 0,
  min_purchase       numeric(12,2) not null default 0,
  max_uses           int,
  uses_count         int not null default 0,
  max_uses_per_user  int,
  starts_at          timestamptz,
  expires_at         timestamptz,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);
create index if not exists idx_coupons_active on public.coupons(is_active);

-- ============================================================
--  PEDIDOS
-- ============================================================
create sequence if not exists order_number_seq start 1000;

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique default ('ORD-' || nextval('order_number_seq')::text),
  user_id          uuid references public.profiles(id) on delete set null,
  status           order_status not null default 'pending',
  subtotal         numeric(12,2) not null default 0,
  discount_total   numeric(12,2) not null default 0,
  shipping_total   numeric(12,2) not null default 0,
  tax_total        numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  currency         text not null default 'COP',
  coupon_id        uuid references public.coupons(id) on delete set null,
  shipping_method  text,
  shipping_address jsonb,                -- snapshot de la dirección
  customer_email   text,
  customer_phone   text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);
drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  variant_id   uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  sku          text,
  unit_price   numeric(12,2) not null,
  quantity     int not null check (quantity > 0),
  line_total   numeric(12,2) not null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_product on public.order_items(product_id);

create table if not exists public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  from_status order_status,
  to_status   order_status not null,
  note        text,
  changed_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_status_history_order on public.order_status_history(order_id);

-- ============================================================
--  PAGOS (multi-pasarela)
-- ============================================================
create table if not exists public.payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders(id) on delete cascade,
  provider            payment_provider not null,
  provider_payment_id text,
  status              payment_status not null default 'pending',
  amount              numeric(12,2) not null,
  currency            text not null default 'COP',
  raw                 jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_payments_order on public.payments(order_id);
create index if not exists idx_payments_provider_id on public.payments(provider, provider_payment_id);
drop trigger if exists trg_payments_updated on public.payments;
create trigger trg_payments_updated before update on public.payments
  for each row execute function public.set_updated_at();

create table if not exists public.coupon_usage (
  id               uuid primary key default gen_random_uuid(),
  coupon_id        uuid not null references public.coupons(id) on delete cascade,
  user_id          uuid references public.profiles(id) on delete set null,
  order_id         uuid references public.orders(id) on delete set null,
  discount_applied numeric(12,2) not null default 0,
  used_at          timestamptz not null default now()
);
create index if not exists idx_coupon_usage_coupon on public.coupon_usage(coupon_id);
create index if not exists idx_coupon_usage_user on public.coupon_usage(user_id);

-- ============================================================
--  RESEÑAS
-- ============================================================
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  rating      int not null check (rating between 1 and 5),
  title       text,
  comment     text,
  is_approved boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (product_id, user_id)
);
create index if not exists idx_reviews_product on public.reviews(product_id);

-- ============================================================
--  NOTIFICACIONES
-- ============================================================
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       notification_type not null,
  title      text not null,
  body       text,
  data       jsonb,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id, is_read);

-- ============================================================
--  CONFIGURACIÓN (clave/valor) + REPORTES + AUDITORÍA
-- ============================================================
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_reports (
  report_date    date primary key,
  orders_count   int not null default 0,
  gross_sales    numeric(14,2) not null default 0,
  net_sales      numeric(14,2) not null default 0,
  items_sold     int not null default 0,
  new_customers  int not null default 0,
  created_at     timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid references public.profiles(id) on delete set null,
  action     text not null,
  entity     text,
  entity_id  text,
  meta       jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_admin on public.admin_audit_log(admin_id);
create index if not exists idx_audit_created on public.admin_audit_log(created_at desc);
