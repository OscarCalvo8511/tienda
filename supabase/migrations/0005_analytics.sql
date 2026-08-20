-- Analítica en vivo: vistas, visitantes activos y carritos abandonados.
-- Una fila por sesión anónima (session_id generado en el navegador).

create table if not exists tienda.analytics_sessions (
  session_id       text primary key,
  first_seen       timestamptz not null default now(),
  last_seen        timestamptz not null default now(),
  views            integer     not null default 0,
  cart_items       integer     not null default 0,
  cart_value       numeric     not null default 0,
  cart_updated_at  timestamptz
);

create index if not exists analytics_sessions_last_seen_idx
  on tienda.analytics_sessions (last_seen);
create index if not exists analytics_sessions_cart_idx
  on tienda.analytics_sessions (cart_items, cart_updated_at);

-- RLS activo sin políticas: solo el service_role (servidor) y las funciones
-- security definer pueden leer/escribir. El público no accede directamente.
alter table tienda.analytics_sessions enable row level security;

-- Registrar una vista de página.
create or replace function tienda.track_view(p_session text)
returns void language sql security definer set search_path = tienda as $$
  insert into tienda.analytics_sessions (session_id, views, last_seen)
  values (p_session, 1, now())
  on conflict (session_id) do update
    set views = tienda.analytics_sessions.views + 1,
        last_seen = now();
$$;

-- Latido de presencia (mantiene "activo ahora").
create or replace function tienda.track_ping(p_session text)
returns void language sql security definer set search_path = tienda as $$
  insert into tienda.analytics_sessions (session_id, last_seen)
  values (p_session, now())
  on conflict (session_id) do update set last_seen = now();
$$;

-- Estado actual del carrito de la sesion.
create or replace function tienda.track_cart(p_session text, p_items integer, p_value numeric)
returns void language sql security definer set search_path = tienda as $$
  insert into tienda.analytics_sessions (session_id, cart_items, cart_value, cart_updated_at, last_seen)
  values (p_session, p_items, p_value, now(), now())
  on conflict (session_id) do update
    set cart_items = p_items,
        cart_value = p_value,
        cart_updated_at = now(),
        last_seen = now();
$$;

-- Metricas en vivo para el panel de admin.
create or replace function tienda.get_live_stats()
returns json language sql security definer set search_path = tienda as $$
  select json_build_object(
    'totalViews',      coalesce(sum(views), 0),
    'activeNow',       count(*) filter (where last_seen > now() - interval '90 seconds'),
    'abandonedCarts',  count(*) filter (where cart_items > 0 and cart_updated_at < now() - interval '30 minutes')
  )
  from tienda.analytics_sessions;
$$;

grant execute on function tienda.track_view(text)                     to anon, authenticated, service_role;
grant execute on function tienda.track_ping(text)                     to anon, authenticated, service_role;
grant execute on function tienda.track_cart(text, integer, numeric)   to anon, authenticated, service_role;
grant execute on function tienda.get_live_stats()                     to authenticated, service_role;
