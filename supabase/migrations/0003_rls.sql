-- ============================================================
--  0003_rls.sql — Row Level Security
--  Regla general:
--   * Catálogo (categorías, productos, imágenes, variantes, reseñas
--     aprobadas) → lectura pública.
--   * Datos del usuario → solo su dueño.
--   * Escritura administrativa → is_admin().
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.products            enable row level security;
alter table public.product_images      enable row level security;
alter table public.product_variants    enable row level security;
alter table public.inventory           enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.addresses           enable row level security;
alter table public.carts               enable row level security;
alter table public.cart_items          enable row level security;
alter table public.wishlists           enable row level security;
alter table public.wishlist_items      enable row level security;
alter table public.coupons             enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments            enable row level security;
alter table public.coupon_usage        enable row level security;
alter table public.reviews             enable row level security;
alter table public.notifications       enable row level security;
alter table public.settings            enable row level security;
alter table public.sales_reports       enable row level security;
alter table public.admin_audit_log     enable row level security;

-- ---------------- PROFILES ----------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- CATÁLOGO (lectura pública / escritura admin) ----------------
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories
  for select using (is_active or public.is_admin());
drop policy if exists categories_admin on public.categories;
create policy categories_admin on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists products_read on public.products;
create policy products_read on public.products
  for select using (is_active or public.is_admin());
drop policy if exists products_admin on public.products;
create policy products_admin on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists product_images_read on public.product_images;
create policy product_images_read on public.product_images
  for select using (true);
drop policy if exists product_images_admin on public.product_images;
create policy product_images_admin on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists variants_read on public.product_variants;
create policy variants_read on public.product_variants
  for select using (true);
drop policy if exists variants_admin on public.product_variants;
create policy variants_admin on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- INVENTARIO (solo admin) ----------------
drop policy if exists inventory_admin on public.inventory;
create policy inventory_admin on public.inventory
  for all using (public.is_admin()) with check (public.is_admin());
-- lectura pública del stock (para mostrar disponibilidad)
drop policy if exists inventory_read on public.inventory;
create policy inventory_read on public.inventory
  for select using (true);

drop policy if exists movements_admin on public.inventory_movements;
create policy movements_admin on public.inventory_movements
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- DIRECCIONES ----------------
drop policy if exists addresses_own on public.addresses;
create policy addresses_own on public.addresses
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ---------------- CARRITOS ----------------
drop policy if exists carts_own on public.carts;
create policy carts_own on public.carts
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists cart_items_own on public.cart_items;
create policy cart_items_own on public.cart_items
  for all using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
    or public.is_admin()
  );

-- ---------------- WISHLIST ----------------
drop policy if exists wishlists_own on public.wishlists;
create policy wishlists_own on public.wishlists
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists wishlist_items_own on public.wishlist_items;
create policy wishlist_items_own on public.wishlist_items
  for all using (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid())
    or public.is_admin()
  );

-- ---------------- CUPONES ----------------
-- lectura de cupones activos (para validar en checkout); escritura admin
drop policy if exists coupons_read on public.coupons;
create policy coupons_read on public.coupons
  for select using (is_active or public.is_admin());
drop policy if exists coupons_admin on public.coupons;
create policy coupons_admin on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- PEDIDOS ----------------
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own on public.orders
  for insert with check (user_id = auth.uid() or public.is_admin());
drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id
            and (o.user_id = auth.uid() or public.is_admin()))
  );
drop policy if exists order_items_write on public.order_items;
create policy order_items_write on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id
            and (o.user_id = auth.uid() or public.is_admin()))
  );
drop policy if exists order_items_admin on public.order_items;
create policy order_items_admin on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists status_history_read on public.order_status_history;
create policy status_history_read on public.order_status_history
  for select using (
    exists (select 1 from public.orders o where o.id = order_id
            and (o.user_id = auth.uid() or public.is_admin()))
  );
drop policy if exists status_history_admin on public.order_status_history;
create policy status_history_admin on public.order_status_history
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- PAGOS ----------------
drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments
  for select using (
    exists (select 1 from public.orders o where o.id = order_id
            and (o.user_id = auth.uid() or public.is_admin()))
  );
drop policy if exists payments_admin on public.payments;
create policy payments_admin on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- USO DE CUPONES ----------------
drop policy if exists coupon_usage_own on public.coupon_usage;
create policy coupon_usage_own on public.coupon_usage
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists coupon_usage_admin on public.coupon_usage;
create policy coupon_usage_admin on public.coupon_usage
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- RESEÑAS ----------------
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews
  for select using (is_approved or user_id = auth.uid() or public.is_admin());
drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
  for insert with check (user_id = auth.uid());
drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own on public.reviews
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists reviews_delete on public.reviews;
create policy reviews_delete on public.reviews
  for delete using (user_id = auth.uid() or public.is_admin());

-- ---------------- NOTIFICACIONES ----------------
drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ---------------- SETTINGS ----------------
drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings
  for select using (true);
drop policy if exists settings_admin on public.settings;
create policy settings_admin on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- REPORTES / AUDITORÍA (solo admin) ----------------
drop policy if exists reports_admin on public.sales_reports;
create policy reports_admin on public.sales_reports
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists audit_admin on public.admin_audit_log;
create policy audit_admin on public.admin_audit_log
  for all using (public.is_admin()) with check (public.is_admin());
