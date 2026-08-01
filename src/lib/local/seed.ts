/**
 * Dataset semilla para el MODO LOCAL (sin Supabase).
 * Refleja supabase/migrations/0004_seed.sql.
 */
import type {
  Category,
  Product,
  ProductImage,
  Inventory,
  Coupon,
} from "@/types/database.types";

const now = "2026-01-01T00:00:00.000Z";

export const seedCategories: Category[] = [
  { id: "cat-electronica", name: "Electrónica", slug: "electronica", description: "Tecnología, dispositivos y accesorios", image_url: null, parent_id: null, position: 1, is_active: true, created_at: now },
  { id: "cat-ropa", name: "Ropa", slug: "ropa", description: "Moda para toda la familia", image_url: null, parent_id: null, position: 2, is_active: true, created_at: now },
  { id: "cat-hogar", name: "Hogar", slug: "hogar", description: "Todo para tu casa", image_url: null, parent_id: null, position: 3, is_active: true, created_at: now },
  { id: "cat-celulares", name: "Celulares", slug: "celulares", description: "Smartphones y accesorios", image_url: null, parent_id: "cat-electronica", position: 1, is_active: true, created_at: now },
  { id: "cat-computadores", name: "Computadores", slug: "computadores", description: "Portátiles y de escritorio", image_url: null, parent_id: "cat-electronica", position: 2, is_active: true, created_at: now },
  { id: "cat-tablets", name: "Tablets", slug: "tablets", description: "Tabletas y e-readers", image_url: null, parent_id: "cat-electronica", position: 3, is_active: true, created_at: now },
  { id: "cat-ropa-hombre", name: "Hombre", slug: "ropa-hombre", description: "Ropa para hombre", image_url: null, parent_id: "cat-ropa", position: 1, is_active: true, created_at: now },
  { id: "cat-ropa-mujer", name: "Mujer", slug: "ropa-mujer", description: "Ropa para mujer", image_url: null, parent_id: "cat-ropa", position: 2, is_active: true, created_at: now },
  { id: "cat-ropa-ninos", name: "Niños", slug: "ropa-ninos", description: "Ropa infantil", image_url: null, parent_id: "cat-ropa", position: 3, is_active: true, created_at: now },
];

function makeProduct(p: Partial<Product> & Pick<Product, "id" | "name" | "slug" | "price" | "category_id">): Product {
  return {
    sku: null, barcode: null, brand: null, supplier: null,
    short_description: null, description: null, specifications: {},
    sale_price: null, cost: null, currency: "COP",
    weight_grams: null, length_cm: null, width_cm: null, height_cm: null,
    status: "available", is_active: true, is_featured: false,
    video_url: null, rating_avg: 0, rating_count: 0, sold_count: 0,
    created_at: now, updated_at: now,
    ...p,
  } as Product;
}

export const seedProducts: Product[] = [
  makeProduct({ id: "prod-1", name: "Smartphone Aurora X1", slug: "smartphone-aurora-x1", sku: "CEL-AUR-X1", brand: "Aurora", short_description: 'Pantalla AMOLED 6.7", 256GB, cámara triple 108MP', description: "El Aurora X1 combina un diseño premium con potencia. Pantalla AMOLED de 120Hz, batería de 5000mAh con carga rápida y sistema de cámaras de 108MP.", specifications: { Pantalla: "6.7\" AMOLED 120Hz", Almacenamiento: "256GB", Batería: "5000mAh", Cámara: "108MP" }, price: 2499000, sale_price: 2199000, cost: 1600000, is_featured: true, category_id: "cat-celulares", rating_avg: 4.6, rating_count: 128, sold_count: 340 }),
  makeProduct({ id: "prod-2", name: "Auriculares NovaBuds Pro", slug: "novabuds-pro", sku: "CEL-NOVA-BUDS", brand: "Nova", short_description: "Inalámbricos con cancelación de ruido activa", description: "Sonido envolvente, cancelación de ruido híbrida y hasta 30h de batería con el estuche. Resistentes al agua IPX5.", specifications: { Batería: "30h", Conectividad: "Bluetooth 5.3", Resistencia: "IPX5" }, price: 399000, sale_price: 329000, cost: 180000, is_featured: true, category_id: "cat-celulares", rating_avg: 4.4, rating_count: 89, sold_count: 512 }),
  makeProduct({ id: "prod-3", name: "Portátil ZenBook Air 14", slug: "zenbook-air-14", sku: "COMP-ZEN-14", brand: "Zen", short_description: 'Intel Core i7, 16GB RAM, SSD 512GB, 14"', description: "Ultraligero de 1.2kg con pantalla IPS de 14\", ideal para trabajo y estudio. Autonomía de 12 horas.", specifications: { Procesador: "Intel Core i7", RAM: "16GB", Almacenamiento: "SSD 512GB", Peso: "1.2kg" }, price: 4899000, cost: 3600000, is_featured: true, category_id: "cat-computadores", rating_avg: 4.8, rating_count: 64, sold_count: 120 }),
  makeProduct({ id: "prod-4", name: 'Monitor UltraView 27"', slug: "monitor-ultraview-27", sku: "COMP-UV-27", brand: "UltraView", short_description: "QHD 165Hz, panel IPS, HDR10", description: "Monitor gamer de 27\" con 165Hz, 1ms y cobertura sRGB 99%. Soporte ajustable en altura.", specifications: { Tamaño: "27\"", Resolución: "QHD 2560x1440", Refresco: "165Hz" }, price: 1299000, sale_price: 1099000, cost: 820000, category_id: "cat-computadores", rating_avg: 4.5, rating_count: 42, sold_count: 210 }),
  makeProduct({ id: "prod-5", name: "Tablet SlatePad 11", slug: "slatepad-11", sku: "TAB-SLATE-11", brand: "Slate", short_description: 'Pantalla 11" 2K, 128GB, con lápiz incluido', description: "Perfecta para dibujar y tomar notas. Incluye lápiz con 4096 niveles de presión y teclado magnético opcional.", specifications: { Pantalla: "11\" 2K", Almacenamiento: "128GB", Extras: "Lápiz incluido" }, price: 1799000, sale_price: 1599000, cost: 1200000, is_featured: true, category_id: "cat-tablets", rating_avg: 4.7, rating_count: 71, sold_count: 180 }),
  makeProduct({ id: "prod-6", name: "Camiseta Algodón Premium", slug: "camiseta-algodon-premium", sku: "ROP-H-CAM-01", brand: "Basics", short_description: "100% algodón peinado, corte regular", description: "Camiseta suave y transpirable de algodón peinado. Disponible en varios colores.", specifications: { Material: "100% algodón peinado", Corte: "Regular" }, price: 79000, sale_price: 59000, cost: 28000, category_id: "cat-ropa-hombre", rating_avg: 4.2, rating_count: 210, sold_count: 890 }),
  makeProduct({ id: "prod-7", name: "Vestido Casual Verano", slug: "vestido-casual-verano", sku: "ROP-M-VES-01", brand: "Bloom", short_description: "Tela ligera, ideal para clima cálido", description: "Vestido fresco con estampado floral, perfecto para el día a día.", specifications: { Material: "Viscosa", Estilo: "Casual" }, price: 149000, sale_price: 119000, cost: 55000, is_featured: true, category_id: "cat-ropa-mujer", rating_avg: 4.6, rating_count: 156, sold_count: 430 }),
  makeProduct({ id: "prod-8", name: "Conjunto Deportivo Niños", slug: "conjunto-deportivo-ninos", sku: "ROP-N-CON-01", brand: "KidsFit", short_description: "Sudadera + pantalón, algodón suave", description: "Cómodo conjunto deportivo para niños, resistente y fácil de lavar.", specifications: { Material: "Algodón", Incluye: "Sudadera + pantalón" }, price: 109000, cost: 45000, category_id: "cat-ropa-ninos", rating_avg: 4.3, rating_count: 48, sold_count: 260 }),
];

const IMG: Record<string, string> = {
  "prod-1": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
  "prod-2": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
  "prod-3": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
  "prod-4": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80",
  "prod-5": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80",
  "prod-6": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
  "prod-7": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
  "prod-8": "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&q=80",
};

export const seedImages: ProductImage[] = seedProducts.map((p, i) => ({
  id: `img-${p.id}`,
  product_id: p.id,
  url: IMG[p.id],
  alt: p.name,
  is_primary: true,
  position: 0,
  created_at: now,
}));

export const seedInventory: Inventory[] = seedProducts.map((p) => ({
  id: `inv-${p.id}`,
  product_id: p.id,
  variant_id: null,
  quantity: 50,
  low_stock_threshold: 5,
  updated_at: now,
}));

export const seedCoupons: Coupon[] = [
  { id: "coupon-1", code: "BIENVENIDO10", description: "10% de descuento de bienvenida", type: "percentage", value: 10, min_purchase: 100000, max_uses: 1000, uses_count: 0, max_uses_per_user: null, starts_at: null, expires_at: null, is_active: true, created_at: now },
];

export const seedSettings = {
  store: {
    name: "Tienda",
    logo_url: null,
    primary_color: "#171717",
    contact_email: "contacto@tienda.co",
    contact_phone: "+57 300 000 0000",
    social: { instagram: "", facebook: "", whatsapp: "" },
  },
  shipping: {
    free_threshold: 200000,
    methods: [
      { id: "standard", name: "Envío estándar (3-5 días)", price: 12000 },
      { id: "express", name: "Envío express (1-2 días)", price: 25000 },
    ],
  },
  tax: { rate: 0.19, included: true },
};
