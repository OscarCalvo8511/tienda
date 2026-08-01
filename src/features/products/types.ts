/**
 * Tipos y utilidades puras de productos (sin dependencias de servidor).
 * Seguro de importar desde componentes cliente.
 */
import type { Product, ProductImage } from "@/types/database.types";

export type ProductWithImage = Product & {
  product_images: Pick<ProductImage, "url" | "alt" | "is_primary" | "position">[];
  categories?: { name: string; slug: string } | null;
};

export interface ProductFilters {
  categorySlug?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  onSale?: boolean;
  sort?: "price_asc" | "price_desc" | "newest" | "best_selling" | "top_rated";
  page?: number;
  pageSize?: number;
}

/** Imagen principal de un producto con imágenes cargadas. */
export function primaryImage(p: ProductWithImage): string | null {
  const imgs = p.product_images ?? [];
  const main = imgs.find((i) => i.is_primary) ?? imgs[0];
  return main?.url ?? null;
}
