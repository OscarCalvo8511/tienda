import "server-only";
import { db } from "./store";
import type { Product, ProductVariant } from "@/types/database.types";
import type { ProductWithImage, ProductFilters } from "@/features/products/api";
import type { CategoryTree } from "@/features/categories/api";

function withImage(p: Product): ProductWithImage {
  const database = db();
  const imgs = database.product_images
    .filter((i) => i.product_id === p.id)
    .map((i) => ({
      url: i.url,
      alt: i.alt,
      is_primary: i.is_primary,
      position: i.position,
    }));
  const cat = database.categories.find((c) => c.id === p.category_id);
  return {
    ...p,
    product_images: imgs,
    categories: cat ? { name: cat.name, slug: cat.slug } : null,
  };
}

function descendantCategoryIds(slug: string): string[] {
  const database = db();
  const parent = database.categories.find((c) => c.slug === slug);
  if (!parent) return [];
  const children = database.categories.filter((c) => c.parent_id === parent.id);
  return [parent.id, ...children.map((c) => c.id)];
}

export function localGetProducts(filters: ProductFilters = {}) {
  const database = db();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 12;

  let items = database.products.filter((p) => p.is_active);

  if (filters.categorySlug) {
    const ids = descendantCategoryIds(filters.categorySlug);
    items = items.filter((p) => p.category_id && ids.includes(p.category_id));
  }
  if (filters.brand) items = items.filter((p) => p.brand === filters.brand);
  if (filters.minPrice != null)
    items = items.filter((p) => p.price >= filters.minPrice!);
  if (filters.maxPrice != null)
    items = items.filter((p) => p.price <= filters.maxPrice!);
  if (filters.onSale) items = items.filter((p) => p.sale_price != null);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.short_description ?? "").toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q),
    );
  }

  switch (filters.sort) {
    case "price_asc":
      items.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      items.sort((a, b) => b.price - a.price);
      break;
    case "best_selling":
      items.sort((a, b) => b.sold_count - a.sold_count);
      break;
    case "top_rated":
      items.sort((a, b) => b.rating_avg - a.rating_avg);
      break;
    default:
      items.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const total = items.length;
  const from = (page - 1) * pageSize;
  const paged = items.slice(from, from + pageSize).map(withImage);

  return {
    products: paged,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function localGetFeatured(limit = 8): ProductWithImage[] {
  return db()
    .products.filter((p) => p.is_active && p.is_featured)
    .slice(0, limit)
    .map(withImage);
}

export function localGetNew(limit = 8): ProductWithImage[] {
  return [...db().products]
    .filter((p) => p.is_active)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map(withImage);
}

export function localGetSale(limit = 8): ProductWithImage[] {
  return db()
    .products.filter((p) => p.is_active && p.sale_price != null)
    .slice(0, limit)
    .map(withImage);
}

export function localGetCarousel(limit = 8): ProductWithImage[] {
  return db()
    .products.filter(
      (p) => p.is_active && (p.is_carousel || p.sale_price != null),
    )
    .sort((a, b) => Number(b.is_carousel ?? false) - Number(a.is_carousel ?? false))
    .slice(0, limit)
    .map(withImage);
}

export function localGetProductBySlug(slug: string) {
  const database = db();
  const p = database.products.find((x) => x.slug === slug && x.is_active);
  if (!p) return null;
  const base = withImage(p);
  const inv = database.inventory.filter((i) => i.product_id === p.id);
  return {
    ...base,
    product_images: database.product_images
      .filter((i) => i.product_id === p.id)
      .map((i) => ({ ...i })),
    product_variants: [] as ProductVariant[],
    inventory: inv.map((i) => ({
      quantity: i.quantity,
      low_stock_threshold: i.low_stock_threshold,
    })),
  };
}

export function localGetRelated(
  categoryId: string | null,
  excludeId: string,
  limit = 4,
): ProductWithImage[] {
  if (!categoryId) return [];
  return db()
    .products.filter(
      (p) => p.is_active && p.category_id === categoryId && p.id !== excludeId,
    )
    .slice(0, limit)
    .map(withImage);
}

export function localGetCategoryTree(): CategoryTree[] {
  const cats = db().categories.filter((c) => c.is_active);
  return cats
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.position - b.position)
    .map((p) => ({
      ...p,
      children: cats
        .filter((c) => c.parent_id === p.id)
        .sort((a, b) => a.position - b.position),
    }));
}

export function localGetAllCategories() {
  return [...db().categories].sort((a, b) => a.position - b.position);
}

export function localGetSettings() {
  return db().settings;
}
