import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import * as local from "@/lib/local/queries";
import type { ProductWithImage, ProductFilters } from "./types";

export type { ProductWithImage, ProductFilters } from "./types";
export { primaryImage } from "./types";

const PAGE_SIZE = 12;

/** Lista de productos con filtros, orden y paginación. */
export async function getProducts(filters: ProductFilters = {}) {
  if (!isSupabaseConfigured()) return local.localGetProducts(filters);
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select(
      "*, product_images(url, alt, is_primary, position), categories(name, slug)",
      { count: "exact" },
    )
    .eq("is_active", true);

  if (filters.categorySlug) {
    // productos de la categoría o de sus subcategorías
    const { data: catData } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .single();
    const cat = catData as { id: string } | null;
    if (cat) {
      const { data: childData } = await supabase
        .from("categories")
        .select("id")
        .eq("parent_id", cat.id);
      const children = (childData ?? []) as { id: string }[];
      const ids = [cat.id, ...children.map((c) => c.id)];
      query = query.in("category_id", ids);
    }
  }

  if (filters.brand) query = query.eq("brand", filters.brand);
  if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
  if (filters.onSale) query = query.not("sale_price", "is", null);
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`,
    );
  }

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "best_selling":
      query = query.order("sold_count", { ascending: false });
      break;
    case "top_rated":
      query = query.order("rating_avg", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  return {
    products: (data ?? []) as ProductWithImage[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

/**
 * Productos para el carrusel de la landing: los marcados "en carrusel/semana"
 * (is_carousel) más los que están en oferta (sale_price), sin repetir.
 */
export async function getCarouselProducts(limit = 8) {
  if (!isSupabaseConfigured()) return local.localGetCarousel(limit);
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(url, alt, is_primary, position)")
    .eq("is_active", true)
    .or("is_carousel.eq.true,sale_price.not.is.null")
    .order("is_carousel", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ProductWithImage[];
}

export async function getFeaturedProducts(limit = 8) {
  if (!isSupabaseConfigured()) return local.localGetFeatured(limit);
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(url, alt, is_primary, position)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .limit(limit);
  return (data ?? []) as ProductWithImage[];
}

export async function getNewProducts(limit = 8) {
  if (!isSupabaseConfigured()) return local.localGetNew(limit);
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(url, alt, is_primary, position)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ProductWithImage[];
}

export async function getSaleProducts(limit = 8) {
  if (!isSupabaseConfigured()) return local.localGetSale(limit);
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(url, alt, is_primary, position)")
    .eq("is_active", true)
    .not("sale_price", "is", null)
    .limit(limit);
  return (data ?? []) as ProductWithImage[];
}

export async function getProductBySlug(slug: string) {
  if (!isSupabaseConfigured()) return local.localGetProductBySlug(slug);
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "*, product_images(*), product_variants(*), categories(name, slug), inventory(quantity, low_stock_threshold)",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data as
    | (ProductWithImage & {
        product_variants: import("@/types/database.types").ProductVariant[];
        inventory: { quantity: number; low_stock_threshold: number }[];
      })
    | null;
}

export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 4,
) {
  if (!categoryId) return [];
  if (!isSupabaseConfigured())
    return local.localGetRelated(categoryId, excludeId, limit);
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(url, alt, is_primary, position)")
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .limit(limit);
  return (data ?? []) as ProductWithImage[];
}

/**
 * Productos sugeridos para la ficha ("Otros productos que te pueden interesar").
 * Primero de la misma categoría y, si no alcanzan, completa con otros productos
 * activos, para que la sección siempre tenga contenido con su foto y precio.
 */
export async function getSuggestedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 4,
): Promise<ProductWithImage[]> {
  if (!isSupabaseConfigured()) {
    const base = local.localGetRelated(categoryId, excludeId, limit);
    if (base.length >= limit) return base.slice(0, limit);
    const { products } = local.localGetProducts({ pageSize: limit + 8 });
    const seen = new Set([excludeId, ...base.map((p) => p.id)]);
    const fill = products.filter((p) => !seen.has(p.id));
    return [...base, ...fill].slice(0, limit);
  }

  const supabase = await createClient();
  const result: ProductWithImage[] = [];
  const seen = new Set<string>([excludeId]);
  const cols = "*, product_images(url, alt, is_primary, position)";

  // 1) Misma categoría.
  if (categoryId) {
    const { data } = await supabase
      .from("products")
      .select(cols)
      .eq("is_active", true)
      .eq("category_id", categoryId)
      .neq("id", excludeId)
      .limit(limit);
    for (const p of (data ?? []) as ProductWithImage[]) {
      if (!seen.has(p.id)) {
        result.push(p);
        seen.add(p.id);
      }
    }
  }

  // 2) Completa con otros productos si faltan.
  if (result.length < limit) {
    const { data } = await supabase
      .from("products")
      .select(cols)
      .eq("is_active", true)
      .neq("id", excludeId)
      .order("created_at", { ascending: false })
      .limit(limit + result.length + 4);
    for (const p of (data ?? []) as ProductWithImage[]) {
      if (result.length >= limit) break;
      if (!seen.has(p.id)) {
        result.push(p);
        seen.add(p.id);
      }
    }
  }

  return result.slice(0, limit);
}
