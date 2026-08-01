-- ============================================================
--  0002_functions.sql — Funciones, triggers y lógica de negocio
-- ============================================================

-- ---------- RBAC helper (SECURITY DEFINER evita recursión RLS) ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- Alta de usuario: crear perfil + wishlist ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.wishlists (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Agregación de calificación de producto ----------
create or replace function public.recalc_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
  set rating_avg = coalesce((
        select round(avg(r.rating)::numeric, 2)
        from public.reviews r
        where r.product_id = pid and r.is_approved
      ), 0),
      rating_count = (
        select count(*) from public.reviews r
        where r.product_id = pid and r.is_approved
      )
  where p.id = pid;
  return null;
end;
$$;

drop trigger if exists trg_reviews_rating on public.reviews;
create trigger trg_reviews_rating
  after insert or update or delete on public.reviews
  for each row execute function public.recalc_product_rating();

-- ---------- Ajuste de inventario con registro de movimiento ----------
-- delta: positivo entra, negativo sale. Devuelve la nueva cantidad.
create or replace function public.adjust_inventory(
  p_product_id uuid,
  p_delta int,
  p_type inventory_movement_type,
  p_reason text default null,
  p_variant_id uuid default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  prev int;
  next_qty int;
  inv_id uuid;
begin
  select id, quantity into inv_id, prev
  from public.inventory
  where product_id = p_product_id
    and variant_id is not distinct from p_variant_id
  for update;

  if inv_id is null then
    prev := 0;
    next_qty := greatest(0, p_delta);
    insert into public.inventory (product_id, variant_id, quantity)
    values (p_product_id, p_variant_id, next_qty)
    returning id into inv_id;
  else
    next_qty := greatest(0, prev + p_delta);
    update public.inventory set quantity = next_qty where id = inv_id;
  end if;

  insert into public.inventory_movements
    (product_id, variant_id, type, quantity, previous_qty, new_qty, reason, created_by)
  values
    (p_product_id, p_variant_id, p_type, p_delta, prev, next_qty, p_reason, auth.uid());

  -- Sincroniza estado del producto con el stock
  update public.products
  set status = case when next_qty <= 0 then 'out_of_stock'::product_status
                    when status = 'out_of_stock' then 'available'::product_status
                    else status end
  where id = p_product_id;

  return next_qty;
end;
$$;

-- ---------- Registrar cambio de estado de pedido ----------
create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_order_status_log on public.orders;
create trigger trg_order_status_log
  after update on public.orders
  for each row execute function public.log_order_status_change();
