-- ============================================================
--  0004_seed.sql — Datos iniciales (categorías, productos demo, settings)
--  Idempotente: usa ON CONFLICT sobre slug/key.
-- ============================================================

-- ---------------- Categorías padre ----------------
insert into public.categories (name, slug, description, position) values
  ('Electrónica', 'electronica', 'Tecnología, dispositivos y accesorios', 1),
  ('Ropa', 'ropa', 'Moda para toda la familia', 2),
  ('Hogar', 'hogar', 'Todo para tu casa', 3)
on conflict (slug) do nothing;

-- ---------------- Subcategorías ----------------
insert into public.categories (name, slug, description, position, parent_id)
select v.name, v.slug, v.description, v.position,
       (select id from public.categories where slug = v.parent_slug)
from (values
  ('Celulares',   'celulares',   'Smartphones y accesorios', 1, 'electronica'),
  ('Computadores','computadores','Portátiles y de escritorio', 2, 'electronica'),
  ('Tablets',     'tablets',     'Tabletas y e-readers', 3, 'electronica'),
  ('Hombre',      'ropa-hombre', 'Ropa para hombre', 1, 'ropa'),
  ('Mujer',       'ropa-mujer',  'Ropa para mujer', 2, 'ropa'),
  ('Niños',       'ropa-ninos',  'Ropa infantil', 3, 'ropa')
) as v(name, slug, description, position, parent_slug)
on conflict (slug) do nothing;

-- ---------------- Productos demo ----------------
insert into public.products
  (name, slug, sku, brand, short_description, description, price, sale_price,
   cost, is_featured, category_id, status)
select p.name, p.slug, p.sku, p.brand, p.short_desc, p.long_desc,
       p.price, p.sale_price, p.cost, p.featured,
       (select id from public.categories where slug = p.cat_slug), 'available'::product_status
from (values
  ('Smartphone Aurora X1', 'smartphone-aurora-x1', 'CEL-AUR-X1', 'Aurora',
   'Pantalla AMOLED 6.7", 256GB, cámara triple 108MP',
   'El Aurora X1 combina un diseño premium con potencia. Pantalla AMOLED de 120Hz, batería de 5000mAh con carga rápida y sistema de cámaras de 108MP.',
   2499000, 2199000, 1600000, true, 'celulares'),
  ('Auriculares NovaBuds Pro', 'novabuds-pro', 'CEL-NOVA-BUDS', 'Nova',
   'Inalámbricos con cancelación de ruido activa',
   'Sonido envolvente, cancelación de ruido híbrida y hasta 30h de batería con el estuche. Resistentes al agua IPX5.',
   399000, 329000, 180000, true, 'celulares'),
  ('Portátil ZenBook Air 14', 'zenbook-air-14', 'COMP-ZEN-14', 'Zen',
   'Intel Core i7, 16GB RAM, SSD 512GB, 14"',
   'Ultraligero de 1.2kg con pantalla IPS de 14", ideal para trabajo y estudio. Autonomía de 12 horas.',
   4899000, null, 3600000, true, 'computadores'),
  ('Monitor UltraView 27"', 'monitor-ultraview-27', 'COMP-UV-27', 'UltraView',
   'QHD 165Hz, panel IPS, HDR10',
   'Monitor gamer de 27" con 165Hz, 1ms y cobertura sRGB 99%. Soporte ajustable en altura.',
   1299000, 1099000, 820000, false, 'computadores'),
  ('Tablet SlatePad 11', 'slatepad-11', 'TAB-SLATE-11', 'Slate',
   'Pantalla 11" 2K, 128GB, con lápiz incluido',
   'Perfecta para dibujar y tomar notas. Incluye lápiz con 4096 niveles de presión y teclado magnético opcional.',
   1799000, 1599000, 1200000, true, 'tablets'),
  ('Camiseta Algodón Premium', 'camiseta-algodon-premium', 'ROP-H-CAM-01', 'Basics',
   '100% algodón peinado, corte regular',
   'Camiseta suave y transpirable de algodón peinado. Disponible en varios colores.',
   79000, 59000, 28000, false, 'ropa-hombre'),
  ('Vestido Casual Verano', 'vestido-casual-verano', 'ROP-M-VES-01', 'Bloom',
   'Tela ligera, ideal para clima cálido',
   'Vestido fresco con estampado floral, perfecto para el día a día.',
   149000, 119000, 55000, true, 'ropa-mujer'),
  ('Conjunto Deportivo Niños', 'conjunto-deportivo-ninos', 'ROP-N-CON-01', 'KidsFit',
   'Sudadera + pantalón, algodón suave',
   'Cómodo conjunto deportivo para niños, resistente y fácil de lavar.',
   109000, null, 45000, false, 'ropa-ninos')
) as p(name, slug, sku, brand, short_desc, long_desc, price, sale_price, cost, featured, cat_slug)
on conflict (slug) do nothing;

-- ---------------- Imagen principal demo por producto ----------------
insert into public.product_images (product_id, url, alt, is_primary, position)
select pr.id, img.url, pr.name, true, 0
from public.products pr
join (values
  ('smartphone-aurora-x1',     'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'),
  ('novabuds-pro',             'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'),
  ('zenbook-air-14',           'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'),
  ('monitor-ultraview-27',     'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80'),
  ('slatepad-11',              'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80'),
  ('camiseta-algodon-premium', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'),
  ('vestido-casual-verano',    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'),
  ('conjunto-deportivo-ninos', 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&q=80')
) as img(slug, url) on img.slug = pr.slug
on conflict do nothing;

-- ---------------- Inventario inicial ----------------
insert into public.inventory (product_id, quantity, low_stock_threshold)
select id, 50, 5 from public.products
on conflict (product_id, variant_id) do nothing;

-- ---------------- Cupón demo ----------------
insert into public.coupons (code, description, type, value, min_purchase, max_uses, is_active)
values ('BIENVENIDO10', '10% de descuento de bienvenida', 'percentage', 10, 100000, 1000, true)
on conflict (code) do nothing;

-- ---------------- Configuración de la tienda ----------------
insert into public.settings (key, value) values
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
