-- ============================================================================
--  RECREAR LA TIENDA EN OTRA BASE DE DATOS (Supabase / PostgreSQL)
--  Esquema: tienda   |   Contenido: SOLO ESTRUCTURA (sin productos)
-- ----------------------------------------------------------------------------
--  Cómo usarlo:
--   1. Crea un proyecto nuevo en Supabase (o usa otra base Postgres con Auth).
--   2. Abre el SQL Editor y pega TODO este archivo. Ejecuta una sola vez.
--   3. En Supabase: Settings → API → "Exposed schemas" y agrega  tienda
--      (el script ya intenta exponerlo, pero conviene dejarlo fijo ahí).
--   4. En tu app, cambia las variables NEXT_PUBLIC_SUPABASE_URL y
--      NEXT_PUBLIC_SUPABASE_ANON_KEY (y SUPABASE_SERVICE_ROLE_KEY) por las
--      del proyecto nuevo. El código ya apunta al esquema "tienda", no hay
--      que tocarlo.
--   5. Crea tu usuario admin: regístrate desde la tienda y luego corre el
--      UPDATE que está comentado al final de este archivo.
--
--  Refleja fielmente la base en vivo, incluyendo cambios posteriores:
--   products.is_carousel, reseñas con author_name / user_id opcional,
--   RPCs de pago (Wompi), auto-siembra de reseñas y bucket de Storage.
--
--  Es idempotente en lo posible (IF NOT EXISTS / OR REPLACE / ON CONFLICT):
--  se puede volver a ejecutar sin romper.
-- ============================================================================

set search_path = tienda, public, extensions;

create schema if not exists tienda;

-- ---------- EXTENSIONES ----------
create extension if not exists pgcrypto with schema extensions;   -- gen_random_uuid()
create extension if not exists citext   with schema extensions;   -- correos / códigos case-insensitive

-- ============================================================================
--  1) ENUMS
-- ============================================================================
do $$ begin create type tienda.user_role as enum ('customer','admin');
exception when duplicate_object then null; end $$;

do $$ begin create type tienda.product_status as enum ('available','out_of_stock','coming_soon');
exception when duplicate_object then null; end $$;

do $$ begin create type tienda.order_status as enum
  ('pending','paid','preparing','shipped','delivered','cancelled','returned');
exception when duplicate_object then null; end $$;

do $$ begin create type tienda.payment_status as enum ('pending','approved','failed','refunded');
exception when duplicate_object then null; end $$;

do $$ begin create type tienda.payment_provider as enum
  ('stripe','mercadopago','paypal','wompi','payu','manual');
exception when duplicate_object then null; end $$;

do $$ begin create type tienda.inventory_movement_type as enum
  ('in','out','adjustment','sale','return');
exception when duplicate_object then null; end $$;

do $$ begin create type tienda.coupon_type as enum ('percentage','fixed','free_shipping');
exception when duplicate_object then null; end $$;

do $$ begin create type tienda.notification_type as enum
  ('welcome','order_created','payment_approved','order_shipped','order_delivered','password_reset','low_stock');
exception when duplicate_object then null; end $$;

-- ============================================================================
--  2) UTILIDAD updated_at
-- ============================================================================
create or replace function tienda.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ============================================================================
--  3) TABLAS
-- ============================================================================

-- ---------- PERFILES (extiende auth.users 1:1) ----------
create table if not exists tienda.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      citext,
  full_name  text,
  phone      text,
  avatar_url text,
  role       tienda.user_role not null default 'customer',
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_role on tienda.profiles(role);
drop trigger if exists trg_profiles_updated on tienda.profiles;
create trigger trg_profiles_updated before update on tienda.profiles
  for each row execute function tienda.set_updated_at();

-- ---------- CATEGORÍAS (padre / hija) ----------
create table if not exists tienda.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  parent_id   uuid references tienda.categories(id) on delete set null,
  position    int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_categories_parent on tienda.categories(parent_id);
create index if not exists idx_categories_active on tienda.categories(is_active);

-- ---------- PRODUCTOS ----------
create table if not exists tienda.products (
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
  status            tienda.product_status not null default 'available',
  is_active         boolean not null default true,
  is_featured       boolean not null default false,
  is_carousel       boolean not null default false,   -- "Destacado de la semana"
  category_id       uuid references tienda.categories(id) on delete set null,
  video_url         text,
  rating_avg        numeric(3,2) not null default 0,
  rating_count      int not null default 0,
  sold_count        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint sale_lt_price check (sale_price is null or sale_price <= price)
);
create index if not exists idx_products_category on tienda.products(category_id);
create index if not exists idx_products_active   on tienda.products(is_active);
create index if not exists idx_products_featured on tienda.products(is_featured);
create index if not exists idx_products_carousel on tienda.products(is_carousel) where is_carousel;
create index if not exists idx_products_status   on tienda.products(status);
create index if not exists idx_products_created  on tienda.products(created_at desc);
create index if not exists idx_products_name_trgm on tienda.products
  using gin (to_tsvector('spanish', coalesce(name,'') || ' ' || coalesce(short_description,'')));
drop trigger if exists trg_products_updated on tienda.products;
create trigger trg_products_updated before update on tienda.products
  for each row execute function tienda.set_updated_at();

create table if not exists tienda.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references tienda.products(id) on delete cascade,
  url        text not null,
  alt        text,
  is_primary boolean not null default false,
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_images_product on tienda.product_images(product_id);
create unique index if not exists uniq_primary_image
  on tienda.product_images(product_id) where is_primary;

create table if not exists tienda.product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references tienda.products(id) on delete cascade,
  name       text not null,
  sku        text unique,
  price      numeric(12,2) check (price >= 0),
  attributes jsonb not null default '{}'::jsonb,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_variants_product on tienda.product_variants(product_id);

-- ---------- INVENTARIO ----------
create table if not exists tienda.inventory (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references tienda.products(id) on delete cascade,
  variant_id          uuid references tienda.product_variants(id) on delete cascade,
  quantity            int not null default 0 check (quantity >= 0),
  low_stock_threshold int not null default 5,
  updated_at          timestamptz not null default now(),
  unique (product_id, variant_id)
);
create index if not exists idx_inventory_product on tienda.inventory(product_id);
drop trigger if exists trg_inventory_updated on tienda.inventory;
create trigger trg_inventory_updated before update on tienda.inventory
  for each row execute function tienda.set_updated_at();

create table if not exists tienda.inventory_movements (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references tienda.products(id) on delete cascade,
  variant_id   uuid references tienda.product_variants(id) on delete set null,
  type         tienda.inventory_movement_type not null,
  quantity     int not null,
  previous_qty int,
  new_qty      int,
  reason       text,
  created_by   uuid references tienda.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_movements_product on tienda.inventory_movements(product_id);
create index if not exists idx_movements_created on tienda.inventory_movements(created_at desc);

-- ---------- DIRECCIONES ----------
create table if not exists tienda.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references tienda.profiles(id) on delete cascade,
  full_name   text not null,
  phone       text not null,
  line1       text not null,
  line2       text,
  city        text not null,
  department  text not null,
  country     text not null default 'Colombia',
  postal_code text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_addresses_user on tienda.addresses(user_id);

-- ---------- CARRITO ----------
create table if not exists tienda.carts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references tienda.profiles(id) on delete cascade,
  session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uniq_cart_user on tienda.carts(user_id) where user_id is not null;
create index if not exists idx_carts_session on tienda.carts(session_id);
drop trigger if exists trg_carts_updated on tienda.carts;
create trigger trg_carts_updated before update on tienda.carts
  for each row execute function tienda.set_updated_at();

create table if not exists tienda.cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references tienda.carts(id) on delete cascade,
  product_id uuid not null references tienda.products(id) on delete cascade,
  variant_id uuid references tienda.product_variants(id) on delete set null,
  quantity   int not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null,
  created_at timestamptz not null default now(),
  unique (cart_id, product_id, variant_id)
);
create index if not exists idx_cart_items_cart on tienda.cart_items(cart_id);

-- ---------- LISTA DE DESEOS ----------
create table if not exists tienda.wishlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references tienda.profiles(id) on delete cascade unique,
  created_at timestamptz not null default now()
);

create table if not exists tienda.wishlist_items (
  id          uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references tienda.wishlists(id) on delete cascade,
  product_id  uuid not null references tienda.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (wishlist_id, product_id)
);
create index if not exists idx_wishlist_items_wishlist on tienda.wishlist_items(wishlist_id);

-- ---------- CUPONES ----------
create table if not exists tienda.coupons (
  id                uuid primary key default gen_random_uuid(),
  code              citext not null unique,
  description       text,
  type              tienda.coupon_type not null,
  value             numeric(12,2) not null default 0,
  min_purchase      numeric(12,2) not null default 0,
  max_uses          int,
  uses_count        int not null default 0,
  max_uses_per_user int,
  starts_at         timestamptz,
  expires_at        timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);
create index if not exists idx_coupons_active on tienda.coupons(is_active);

-- ---------- PEDIDOS ----------
create sequence if not exists tienda.order_number_seq start 1000;

create table if not exists tienda.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique default ('ORD-' || nextval('tienda.order_number_seq')::text),
  user_id          uuid references tienda.profiles(id) on delete set null,
  status           tienda.order_status not null default 'pending',
  subtotal         numeric(12,2) not null default 0,
  discount_total   numeric(12,2) not null default 0,
  shipping_total   numeric(12,2) not null default 0,
  tax_total        numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  currency         text not null default 'COP',
  coupon_id        uuid references tienda.coupons(id) on delete set null,
  shipping_method  text,
  shipping_address jsonb,
  customer_email   text,
  customer_phone   text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_orders_user    on tienda.orders(user_id);
create index if not exists idx_orders_status  on tienda.orders(status);
create index if not exists idx_orders_created on tienda.orders(created_at desc);
drop trigger if exists trg_orders_updated on tienda.orders;
create trigger trg_orders_updated before update on tienda.orders
  for each row execute function tienda.set_updated_at();

create table if not exists tienda.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references tienda.orders(id) on delete cascade,
  product_id   uuid references tienda.products(id) on delete set null,
  variant_id   uuid references tienda.product_variants(id) on delete set null,
  product_name text not null,
  sku          text,
  unit_price   numeric(12,2) not null,
  quantity     int not null check (quantity > 0),
  line_total   numeric(12,2) not null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_order_items_order   on tienda.order_items(order_id);
create index if not exists idx_order_items_product on tienda.order_items(product_id);

create table if not exists tienda.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references tienda.orders(id) on delete cascade,
  from_status tienda.order_status,
  to_status   tienda.order_status not null,
  note        text,
  changed_by  uuid references tienda.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_status_history_order on tienda.order_status_history(order_id);

-- ---------- PAGOS ----------
create table if not exists tienda.payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references tienda.orders(id) on delete cascade,
  provider            tienda.payment_provider not null,
  provider_payment_id text,
  status              tienda.payment_status not null default 'pending',
  amount              numeric(12,2) not null,
  currency            text not null default 'COP',
  raw                 jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_payments_order       on tienda.payments(order_id);
create index if not exists idx_payments_provider_id on tienda.payments(provider, provider_payment_id);
drop trigger if exists trg_payments_updated on tienda.payments;
create trigger trg_payments_updated before update on tienda.payments
  for each row execute function tienda.set_updated_at();

create table if not exists tienda.coupon_usage (
  id               uuid primary key default gen_random_uuid(),
  coupon_id        uuid not null references tienda.coupons(id) on delete cascade,
  user_id          uuid references tienda.profiles(id) on delete set null,
  order_id         uuid references tienda.orders(id) on delete set null,
  discount_applied numeric(12,2) not null default 0,
  used_at          timestamptz not null default now()
);
create index if not exists idx_coupon_usage_coupon on tienda.coupon_usage(coupon_id);
create index if not exists idx_coupon_usage_user   on tienda.coupon_usage(user_id);

-- ---------- RESEÑAS ----------
-- user_id opcional: permite reseñas sin cuenta (author_name).
create table if not exists tienda.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references tienda.products(id) on delete cascade,
  user_id     uuid references tienda.profiles(id) on delete cascade,
  author_name text,
  rating      int not null check (rating between 1 and 5),
  title       text,
  comment     text,
  is_approved boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (product_id, user_id),
  constraint reviews_author_present check (user_id is not null or author_name is not null)
);
create index if not exists idx_reviews_product on tienda.reviews(product_id);

-- ---------- NOTIFICACIONES ----------
create table if not exists tienda.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references tienda.profiles(id) on delete cascade,
  type       tienda.notification_type not null,
  title      text not null,
  body       text,
  data       jsonb,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on tienda.notifications(user_id, is_read);

-- ---------- CONFIGURACIÓN / REPORTES / AUDITORÍA ----------
create table if not exists tienda.settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists tienda.sales_reports (
  report_date   date primary key,
  orders_count  int not null default 0,
  gross_sales   numeric(14,2) not null default 0,
  net_sales     numeric(14,2) not null default 0,
  items_sold    int not null default 0,
  new_customers int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists tienda.admin_audit_log (
  id        uuid primary key default gen_random_uuid(),
  admin_id  uuid references tienda.profiles(id) on delete set null,
  action    text not null,
  entity    text,
  entity_id text,
  meta      jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_admin   on tienda.admin_audit_log(admin_id);
create index if not exists idx_audit_created on tienda.admin_audit_log(created_at desc);

-- ============================================================================
--  4) FUNCIONES Y LÓGICA DE NEGOCIO
-- ============================================================================

-- RBAC helper (SECURITY DEFINER evita recursión en RLS)
create or replace function tienda.is_admin()
returns boolean language sql stable security definer
set search_path to 'tienda','public'
as $$
  select exists (select 1 from tienda.profiles where id = auth.uid() and role = 'admin');
$$;

-- Alta de usuario: crea perfil de tienda solo para registros de la tienda
-- (app=tienda) o inicios con Google. Otras apps que compartan auth NO generan perfil.
create or replace function tienda.handle_new_user()
returns trigger language plpgsql security definer
set search_path to 'tienda','public'
as $$
begin
  if coalesce(new.raw_user_meta_data->>'app', '') <> 'tienda'
     and coalesce(new.raw_app_meta_data->>'provider', '') <> 'google' then
    return new;
  end if;

  insert into tienda.profiles (id, email, full_name, avatar_url)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into tienda.wishlists (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Recalcula promedio/conteo de calificación del producto
create or replace function tienda.recalc_product_rating()
returns trigger language plpgsql security definer
set search_path to 'tienda','public'
as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  update tienda.products p
  set rating_avg = coalesce((
        select round(avg(r.rating)::numeric, 2)
        from tienda.reviews r where r.product_id = pid and r.is_approved
      ), 0),
      rating_count = (
        select count(*) from tienda.reviews r
        where r.product_id = pid and r.is_approved
      )
  where p.id = pid;
  return null;
end;
$$;

-- Ajuste de inventario + registro de movimiento (delta: + entra, - sale)
create or replace function tienda.adjust_inventory(
  p_product_id uuid, p_delta int, p_type tienda.inventory_movement_type,
  p_reason text default null, p_variant_id uuid default null
) returns int language plpgsql security definer
set search_path to 'tienda','public'
as $$
declare prev int; next_qty int; inv_id uuid;
begin
  select id, quantity into inv_id, prev
  from tienda.inventory
  where product_id = p_product_id and variant_id is not distinct from p_variant_id
  for update;

  if inv_id is null then
    prev := 0;
    next_qty := greatest(0, p_delta);
    insert into tienda.inventory (product_id, variant_id, quantity)
    values (p_product_id, p_variant_id, next_qty) returning id into inv_id;
  else
    next_qty := greatest(0, prev + p_delta);
    update tienda.inventory set quantity = next_qty where id = inv_id;
  end if;

  insert into tienda.inventory_movements
    (product_id, variant_id, type, quantity, previous_qty, new_qty, reason, created_by)
  values (p_product_id, p_variant_id, p_type, p_delta, prev, next_qty, p_reason, auth.uid());

  update tienda.products
  set status = case when next_qty <= 0 then 'out_of_stock'::tienda.product_status
                    when status = 'out_of_stock' then 'available'::tienda.product_status
                    else status end
  where id = p_product_id;

  return next_qty;
end;
$$;

-- Registra en el historial los cambios de estado de pedido (UPDATE)
create or replace function tienda.log_order_status_change()
returns trigger language plpgsql security definer
set search_path to 'tienda','public'
as $$
begin
  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into tienda.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

-- Venta simulada (pago aprobado inmediato): sold_count + cupón + historial inicial
create or replace function tienda.register_sale(p_order_id uuid)
returns void language plpgsql security definer
set search_path to 'tienda','public'
as $$
declare v_coupon uuid; v_user uuid; v_discount numeric; v_status tienda.order_status;
begin
  update tienda.products p
  set sold_count = p.sold_count + agg.qty
  from (
    select product_id, sum(quantity) as qty
    from tienda.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) agg
  where p.id = agg.product_id;

  select coupon_id, user_id, discount_total, status
    into v_coupon, v_user, v_discount, v_status
  from tienda.orders where id = p_order_id;

  if v_coupon is not null then
    update tienda.coupons set uses_count = uses_count + 1 where id = v_coupon;
    insert into tienda.coupon_usage (coupon_id, user_id, order_id, discount_applied)
    values (v_coupon, v_user, p_order_id, coalesce(v_discount, 0));
  end if;

  insert into tienda.order_status_history (order_id, from_status, to_status, note)
  values (p_order_id, null, v_status, 'Pago aprobado (simulado)');
end;
$$;

-- Confirma pago real (Wompi): atómico e idempotente, solo desde 'pending'
create or replace function tienda.confirm_order_payment(
  p_order_id uuid, p_provider tienda.payment_provider, p_provider_ref text, p_amount numeric
) returns tienda.order_status language plpgsql security definer
set search_path to 'tienda','public'
as $$
declare
  v_status tienda.order_status; v_order_number text; v_coupon uuid;
  v_user uuid; v_discount numeric; v_currency text; rec record;
begin
  select status, order_number, coupon_id, user_id, discount_total, currency
    into v_status, v_order_number, v_coupon, v_user, v_discount, v_currency
  from tienda.orders where id = p_order_id for update;

  if not found then raise exception 'Pedido % no existe', p_order_id; end if;
  if v_status <> 'pending' then return v_status; end if;

  update tienda.orders set status = 'paid', updated_at = now() where id = p_order_id;

  for rec in
    select product_id, variant_id, sum(quantity)::int as qty
    from tienda.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id, variant_id
  loop
    perform tienda.adjust_inventory(rec.product_id, -rec.qty, 'sale',
                                    'Venta ' || v_order_number, rec.variant_id);
  end loop;

  update tienda.products p
  set sold_count = p.sold_count + agg.qty
  from (
    select product_id, sum(quantity) as qty
    from tienda.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) agg
  where p.id = agg.product_id;

  if v_coupon is not null then
    update tienda.coupons set uses_count = uses_count + 1 where id = v_coupon;
    insert into tienda.coupon_usage (coupon_id, user_id, order_id, discount_applied)
    values (v_coupon, v_user, p_order_id, coalesce(v_discount, 0));
  end if;

  insert into tienda.payments (order_id, provider, provider_payment_id, status, amount, currency)
  values (p_order_id, p_provider, p_provider_ref, 'approved', p_amount, v_currency);

  return 'paid';
end;
$$;

-- Marca pago fallido/cancelado (par de confirm_order_payment)
create or replace function tienda.fail_order_payment(
  p_order_id uuid, p_provider tienda.payment_provider, p_provider_ref text,
  p_amount numeric, p_new_status tienda.order_status default 'cancelled'
) returns tienda.order_status language plpgsql security definer
set search_path to 'tienda','public'
as $$
declare v_status tienda.order_status; v_currency text;
begin
  select status, currency into v_status, v_currency
  from tienda.orders where id = p_order_id for update;

  if not found then raise exception 'Pedido % no existe', p_order_id; end if;
  if v_status <> 'pending' then return v_status; end if;

  update tienda.orders set status = p_new_status, updated_at = now() where id = p_order_id;

  insert into tienda.payments (order_id, provider, provider_payment_id, status, amount, currency)
  values (p_order_id, p_provider, p_provider_ref, 'failed', p_amount, v_currency);

  return p_new_status;
end;
$$;

-- ----------------------------------------------------------------------------
--  Auto-siembra de reseñas (OPCIONAL – marketing de arranque).
--  Genera reseñas ficticias al crear un producto. Si NO la quieres, borra
--  estas 2 funciones y el trigger trg_seed_product_reviews más abajo.
-- ----------------------------------------------------------------------------
create or replace function tienda.seed_reviews_for_product(pid uuid, n integer)
returns void language plpgsql security definer
set search_path to 'tienda','public'
as $$
declare
  names text[] := array[
    'Andrés G.','Laura M.','Carlos R.','Diana P.','Julián V.','Natalia S.',
    'Camilo T.','Paola H.','Sebastián L.','Marcela C.','Óscar D.','Valentina R.',
    'Jorge A.','Daniela F.','Mateo Q.','Angélica M.','Felipe N.','Carolina B.',
    'Ricardo E.','Juan David M.','Andrea T.','Gustavo A.','Luisa F.','Nicolás B.',
    'Tatiana R.','Sandra L.','Héctor P.','Manuela C.','David R.','Paola V.',
    'Esteban M.','Catalina O.','Fernando A.','Lucía G.','Miguel Á.','Adriana R.',
    'Santiago P.','Verónica L.','Iván C.','Melissa D.'
  ];
  comments text[] := array[
    'La verdad quedé muy contenta, llegó rapidísimo y tal como esperaba.',
    'Me encantó, lo uso casi todos los días y no me ha dado ningún problema.',
    'Excelente atención, cualquier duda me la respondieron enseguida por WhatsApp.',
    'Llegó a Medellín en dos días, muy bien empacado. Recomendado.',
    'Lo pedí con algo de miedo por comprar en línea, pero todo salió perfecto.',
    'Buena calidad para el precio, no esperaba que fuera tan bueno la verdad.',
    'Ya es mi segunda compra en esta tienda, siempre cumplen.',
    'Me llegó un día después de lo que decía, pero el producto vale la pena.',
    'Justo lo que necesitaba, fácil de usar desde el primer momento.',
    'Se lo regalé a mi esposo y quedó feliz. Muy buena compra.',
    'Todo bien; la caja llegó un poco golpeada pero el producto llegó intacto.',
    'Cumple con lo que muestran en las fotos, sin sorpresas. Contento.',
    'Muy buen producto, se siente resistente y de buen material.',
    'Lo recomiendo, la relación calidad-precio es muy buena.',
    'Rápido el envío y buena comunicación durante todo el proceso.',
    'Al principio dudé, pero superó mis expectativas. Gracias!',
    'Práctico y funcional, justo como lo buscaba. Volveré a comprar.',
    'Me sirvió muchísimo, ya varios amigos me preguntaron dónde lo compré.',
    'Llegó antes de lo esperado y todo funcionando. Excelente.',
    'La atención al cliente es de lo mejor, muy amables y atentos.',
    'Cumple su función perfectamente, lo uso a diario y sigue como nuevo.',
    'Compré para regalo y quedó espectacular, muy bien presentado.',
    'Todo perfecto: el pago fue seguro y el envío rápido. Recomendadísimo.',
    'Me encantó la calidad, no me esperaba tanto por ese precio.',
    'Llegó bien a Bogotá, todo funcionando. Muy satisfecho con la compra.',
    'Buena experiencia de compra, todo claro y sin complicaciones.',
    'Vale cada peso, lo recomiendo con los ojos cerrados.',
    'Cumplió con lo prometido, contento con el resultado.',
    'Súper contenta, llegó rápido y bien empacado. Repetiré sin duda.',
    'Muy buen producto y mejor todavía la atención. Cinco estrellas.'
  ];
  titles text[] := array[
    'Muy contenta con la compra','Cumplió mis expectativas','Excelente compra',
    'Lo recomiendo 100%','Volveré a comprar','Justo lo que buscaba',
    'Buena calidad','Todo perfecto','Rápido y bien empacado',
    'Superó mis expectativas','Muy buena atención','Vale la pena',
    'Buen producto','Contento con la compra','Llegó rapidísimo','Recomendado'
  ];
  ratings int[] := array[5,5,5,5,4,4,4];
  used_names text[]; used_comments text[]; i int; nm text; cm text; attempts int;
begin
  if n <= 0 then return; end if;
  select coalesce(array_agg(author_name) filter (where author_name is not null), '{}'),
         coalesce(array_agg(comment) filter (where comment is not null), '{}')
    into used_names, used_comments
    from tienda.reviews where product_id = pid;

  for i in 1..n loop
    attempts := 0;
    loop
      nm := names[1 + floor(random() * array_length(names, 1))::int];
      attempts := attempts + 1;
      exit when not (nm = any(used_names)) or attempts > 50;
    end loop;
    used_names := used_names || nm;

    attempts := 0;
    loop
      cm := comments[1 + floor(random() * array_length(comments, 1))::int];
      attempts := attempts + 1;
      exit when not (cm = any(used_comments)) or attempts > 50;
    end loop;
    used_comments := used_comments || cm;

    insert into tienda.reviews
      (product_id, author_name, rating, title, comment, is_approved, created_at)
    values (
      pid, nm,
      ratings[1 + floor(random() * array_length(ratings, 1))::int],
      titles[1 + floor(random() * array_length(titles, 1))::int],
      cm, true,
      now() - (floor(random() * 45)::int || ' days')::interval
            - (floor(random() * 24)::int || ' hours')::interval
    );
  end loop;
end;
$$;

create or replace function tienda.seed_product_reviews()
returns trigger language plpgsql security definer
set search_path to 'tienda','public'
as $$
begin
  perform tienda.seed_reviews_for_product(new.id, 4 + floor(random() * 11)::int);
  return null;
end;
$$;

-- ============================================================================
--  5) TRIGGERS (sobre tablas + auth.users)
-- ============================================================================
drop trigger if exists trg_reviews_rating on tienda.reviews;
create trigger trg_reviews_rating
  after insert or update or delete on tienda.reviews
  for each row execute function tienda.recalc_product_rating();

drop trigger if exists trg_order_status_log on tienda.orders;
create trigger trg_order_status_log
  after update on tienda.orders
  for each row execute function tienda.log_order_status_change();

-- Auto-siembra de reseñas (OPCIONAL: borra este trigger para desactivarla)
drop trigger if exists trg_seed_product_reviews on tienda.products;
create trigger trg_seed_product_reviews
  after insert on tienda.products
  for each row execute function tienda.seed_product_reviews();

-- Alta de usuario. OJO: si otra app comparte este proyecto Auth y ya tiene un
-- trigger on_auth_user_created, este usa un nombre distinto para no chocar.
drop trigger if exists on_auth_user_created_tienda on auth.users;
create trigger on_auth_user_created_tienda
  after insert on auth.users
  for each row execute function tienda.handle_new_user();

-- ============================================================================
--  6) ROW LEVEL SECURITY
-- ============================================================================
alter table tienda.profiles             enable row level security;
alter table tienda.categories           enable row level security;
alter table tienda.products             enable row level security;
alter table tienda.product_images       enable row level security;
alter table tienda.product_variants     enable row level security;
alter table tienda.inventory            enable row level security;
alter table tienda.inventory_movements  enable row level security;
alter table tienda.addresses            enable row level security;
alter table tienda.carts                enable row level security;
alter table tienda.cart_items           enable row level security;
alter table tienda.wishlists            enable row level security;
alter table tienda.wishlist_items       enable row level security;
alter table tienda.coupons              enable row level security;
alter table tienda.orders               enable row level security;
alter table tienda.order_items          enable row level security;
alter table tienda.order_status_history enable row level security;
alter table tienda.payments             enable row level security;
alter table tienda.coupon_usage         enable row level security;
alter table tienda.reviews              enable row level security;
alter table tienda.notifications        enable row level security;
alter table tienda.settings             enable row level security;
alter table tienda.sales_reports        enable row level security;
alter table tienda.admin_audit_log      enable row level security;

-- PROFILES
drop policy if exists profiles_select_own on tienda.profiles;
create policy profiles_select_own on tienda.profiles
  for select using (id = auth.uid() or tienda.is_admin());
drop policy if exists profiles_update_own on tienda.profiles;
create policy profiles_update_own on tienda.profiles
  for update using (id = auth.uid() or tienda.is_admin())
  with check (id = auth.uid() or tienda.is_admin());
drop policy if exists profiles_admin_all on tienda.profiles;
create policy profiles_admin_all on tienda.profiles
  for all using (tienda.is_admin()) with check (tienda.is_admin());

-- CATÁLOGO (lectura pública / escritura admin)
drop policy if exists categories_read on tienda.categories;
create policy categories_read on tienda.categories
  for select using (is_active or tienda.is_admin());
drop policy if exists categories_admin on tienda.categories;
create policy categories_admin on tienda.categories
  for all using (tienda.is_admin()) with check (tienda.is_admin());

drop policy if exists products_read on tienda.products;
create policy products_read on tienda.products
  for select using (is_active or tienda.is_admin());
drop policy if exists products_admin on tienda.products;
create policy products_admin on tienda.products
  for all using (tienda.is_admin()) with check (tienda.is_admin());

drop policy if exists product_images_read on tienda.product_images;
create policy product_images_read on tienda.product_images for select using (true);
drop policy if exists product_images_admin on tienda.product_images;
create policy product_images_admin on tienda.product_images
  for all using (tienda.is_admin()) with check (tienda.is_admin());

drop policy if exists variants_read on tienda.product_variants;
create policy variants_read on tienda.product_variants for select using (true);
drop policy if exists variants_admin on tienda.product_variants;
create policy variants_admin on tienda.product_variants
  for all using (tienda.is_admin()) with check (tienda.is_admin());

-- INVENTARIO
drop policy if exists inventory_read on tienda.inventory;
create policy inventory_read on tienda.inventory for select using (true);
drop policy if exists inventory_admin on tienda.inventory;
create policy inventory_admin on tienda.inventory
  for all using (tienda.is_admin()) with check (tienda.is_admin());
drop policy if exists movements_admin on tienda.inventory_movements;
create policy movements_admin on tienda.inventory_movements
  for all using (tienda.is_admin()) with check (tienda.is_admin());

-- DIRECCIONES
drop policy if exists addresses_own on tienda.addresses;
create policy addresses_own on tienda.addresses
  for all using (user_id = auth.uid() or tienda.is_admin())
  with check (user_id = auth.uid() or tienda.is_admin());

-- CARRITOS
drop policy if exists carts_own on tienda.carts;
create policy carts_own on tienda.carts
  for all using (user_id = auth.uid() or tienda.is_admin())
  with check (user_id = auth.uid() or tienda.is_admin());
drop policy if exists cart_items_own on tienda.cart_items;
create policy cart_items_own on tienda.cart_items
  for all using (
    exists (select 1 from tienda.carts c where c.id = cart_id and c.user_id = auth.uid())
    or tienda.is_admin())
  with check (
    exists (select 1 from tienda.carts c where c.id = cart_id and c.user_id = auth.uid())
    or tienda.is_admin());

-- WISHLIST
drop policy if exists wishlists_own on tienda.wishlists;
create policy wishlists_own on tienda.wishlists
  for all using (user_id = auth.uid() or tienda.is_admin())
  with check (user_id = auth.uid() or tienda.is_admin());
drop policy if exists wishlist_items_own on tienda.wishlist_items;
create policy wishlist_items_own on tienda.wishlist_items
  for all using (
    exists (select 1 from tienda.wishlists w where w.id = wishlist_id and w.user_id = auth.uid())
    or tienda.is_admin())
  with check (
    exists (select 1 from tienda.wishlists w where w.id = wishlist_id and w.user_id = auth.uid())
    or tienda.is_admin());

-- CUPONES
drop policy if exists coupons_read on tienda.coupons;
create policy coupons_read on tienda.coupons
  for select using (is_active or tienda.is_admin());
drop policy if exists coupons_admin on tienda.coupons;
create policy coupons_admin on tienda.coupons
  for all using (tienda.is_admin()) with check (tienda.is_admin());

-- PEDIDOS
drop policy if exists orders_select_own on tienda.orders;
create policy orders_select_own on tienda.orders
  for select using (user_id = auth.uid() or tienda.is_admin());
drop policy if exists orders_insert_own on tienda.orders;
create policy orders_insert_own on tienda.orders
  for insert with check (user_id = auth.uid() or tienda.is_admin());
drop policy if exists orders_admin_update on tienda.orders;
create policy orders_admin_update on tienda.orders
  for update using (tienda.is_admin()) with check (tienda.is_admin());

drop policy if exists order_items_read on tienda.order_items;
create policy order_items_read on tienda.order_items
  for select using (exists (
    select 1 from tienda.orders o where o.id = order_id
    and (o.user_id = auth.uid() or tienda.is_admin())));
drop policy if exists order_items_write on tienda.order_items;
create policy order_items_write on tienda.order_items
  for insert with check (exists (
    select 1 from tienda.orders o where o.id = order_id
    and (o.user_id = auth.uid() or tienda.is_admin())));
drop policy if exists order_items_admin on tienda.order_items;
create policy order_items_admin on tienda.order_items
  for all using (tienda.is_admin()) with check (tienda.is_admin());

drop policy if exists status_history_read on tienda.order_status_history;
create policy status_history_read on tienda.order_status_history
  for select using (exists (
    select 1 from tienda.orders o where o.id = order_id
    and (o.user_id = auth.uid() or tienda.is_admin())));
drop policy if exists status_history_admin on tienda.order_status_history;
create policy status_history_admin on tienda.order_status_history
  for all using (tienda.is_admin()) with check (tienda.is_admin());

-- PAGOS
drop policy if exists payments_read on tienda.payments;
create policy payments_read on tienda.payments
  for select using (exists (
    select 1 from tienda.orders o where o.id = order_id
    and (o.user_id = auth.uid() or tienda.is_admin())));
drop policy if exists payments_admin on tienda.payments;
create policy payments_admin on tienda.payments
  for all using (tienda.is_admin()) with check (tienda.is_admin());

-- USO DE CUPONES
drop policy if exists coupon_usage_own on tienda.coupon_usage;
create policy coupon_usage_own on tienda.coupon_usage
  for select using (user_id = auth.uid() or tienda.is_admin());
drop policy if exists coupon_usage_admin on tienda.coupon_usage;
create policy coupon_usage_admin on tienda.coupon_usage
  for all using (tienda.is_admin()) with check (tienda.is_admin());

-- RESEÑAS
drop policy if exists reviews_read on tienda.reviews;
create policy reviews_read on tienda.reviews
  for select using (is_approved or user_id = auth.uid() or tienda.is_admin());
drop policy if exists reviews_insert_own on tienda.reviews;
create policy reviews_insert_own on tienda.reviews
  for insert with check (user_id = auth.uid());
drop policy if exists reviews_update_own on tienda.reviews;
create policy reviews_update_own on tienda.reviews
  for update using (user_id = auth.uid() or tienda.is_admin())
  with check (user_id = auth.uid() or tienda.is_admin());
drop policy if exists reviews_delete on tienda.reviews;
create policy reviews_delete on tienda.reviews
  for delete using (user_id = auth.uid() or tienda.is_admin());

-- NOTIFICACIONES
drop policy if exists notifications_own on tienda.notifications;
create policy notifications_own on tienda.notifications
  for all using (user_id = auth.uid() or tienda.is_admin())
  with check (user_id = auth.uid() or tienda.is_admin());

-- SETTINGS
drop policy if exists settings_read on tienda.settings;
create policy settings_read on tienda.settings for select using (true);
drop policy if exists settings_admin on tienda.settings;
create policy settings_admin on tienda.settings
  for all using (tienda.is_admin()) with check (tienda.is_admin());

-- REPORTES / AUDITORÍA
drop policy if exists reports_admin on tienda.sales_reports;
create policy reports_admin on tienda.sales_reports
  for all using (tienda.is_admin()) with check (tienda.is_admin());
drop policy if exists audit_admin on tienda.admin_audit_log;
create policy audit_admin on tienda.admin_audit_log
  for all using (tienda.is_admin()) with check (tienda.is_admin());

-- ============================================================================
--  7) PERMISOS Y EXPOSICIÓN DEL ESQUEMA A LA API (PostgREST)
--     Necesario para que la app (roles anon/authenticated) pueda leer/escribir.
-- ============================================================================
grant usage on schema tienda to anon, authenticated, service_role;

grant select on all tables in schema tienda to anon, authenticated;
grant insert, update, delete on all tables in schema tienda to authenticated;
grant all on all tables in schema tienda to service_role;
grant usage, select on all sequences in schema tienda to anon, authenticated, service_role;
grant execute on all functions in schema tienda to anon, authenticated, service_role;

alter default privileges in schema tienda grant select on tables to anon, authenticated;
alter default privileges in schema tienda grant insert, update, delete on tables to authenticated;
alter default privileges in schema tienda grant all on tables to service_role;
alter default privileges in schema tienda grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema tienda grant execute on functions to anon, authenticated, service_role;

-- Expone el esquema a la API REST. Además: Dashboard → Settings → API →
-- "Exposed schemas" y agrega  tienda  (para que persista ante reinicios).
do $$ begin
  execute 'alter role authenticator set pgrst.db_schemas = ' ||
          quote_literal('public, graphql_public, tienda');
exception when others then
  raise notice 'No se pudo fijar pgrst.db_schemas (hazlo desde el Dashboard).';
end $$;
notify pgrst, 'reload config';

-- ============================================================================
--  8) STORAGE: bucket público "productos" (subida de imágenes desde el admin)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists productos_public_read on storage.objects;
create policy productos_public_read on storage.objects
  for select to public using (bucket_id = 'productos');

drop policy if exists productos_admin_insert on storage.objects;
create policy productos_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'productos' and tienda.is_admin());

drop policy if exists productos_admin_update on storage.objects;
create policy productos_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'productos' and tienda.is_admin())
  with check (bucket_id = 'productos' and tienda.is_admin());

drop policy if exists productos_admin_delete on storage.objects;
create policy productos_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'productos' and tienda.is_admin());

-- ============================================================================
--  9) CONFIGURACIÓN MÍNIMA DE LA TIENDA (recomendado)
--     No son "productos": son los ajustes de envío, IVA y datos de contacto
--     que la app necesita para que el checkout calcule bien. Puedes editarlos.
--     Si quieres una base 100% vacía, borra este bloque.
-- ============================================================================
insert into tienda.settings (key, value) values
  ('store', jsonb_build_object(
    'name', 'Tienda',
    'logo_url', null,
    'primary_color', '#171717',
    'contact_email', 'contacto@tienda.co',
    'contact_phone', '+57 300 000 0000',
    'social', jsonb_build_object('instagram','', 'facebook','', 'whatsapp','')
  )),
  ('shipping', jsonb_build_object(
    'free_threshold', 200000,
    'methods', jsonb_build_array(
      jsonb_build_object('id','standard','name','Envío estándar (3-5 días)','price',12000),
      jsonb_build_object('id','express','name','Envío express (1-2 días)','price',25000)
    )
  )),
  ('tax', jsonb_build_object('rate', 0.19, 'included', true))
on conflict (key) do nothing;

-- ============================================================================
--  10) CREAR TU USUARIO ADMIN
--  Los usuarios se crean vía Auth (regístrate desde la tienda o desde
--  Dashboard → Authentication → Users). Luego promuévelo a admin:
--
--   update tienda.profiles set role = 'admin'
--   where email = 'tu-correo@ejemplo.com';
--
--  Si te registraste desde el Dashboard (sin metadato app=tienda) y no se creó
--  la fila en tienda.profiles, créala a mano tomando el id de auth.users:
--
--   insert into tienda.profiles (id, email, role)
--   select id, email, 'admin' from auth.users where email = 'tu-correo@ejemplo.com'
--   on conflict (id) do update set role = 'admin';
--   insert into tienda.wishlists (user_id)
--   select id from auth.users where email = 'tu-correo@ejemplo.com'
--   on conflict (user_id) do nothing;
-- ============================================================================

-- FIN.
