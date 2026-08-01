import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { db, mutate, uid } from "@/lib/local/store";
import { slugify } from "@/lib/utils";
import type { Product, ProductImage, Json, Database } from "@/types/database.types";

export interface AdminProductRow extends Product {
  stock: number;
  image: string | null;
  category_name: string | null;
}

export interface ProductInput {
  name: string;
  sku?: string | null;
  barcode?: string | null;
  brand?: string | null;
  supplier?: string | null;
  short_description?: string | null;
  description?: string | null;
  price: number;
  sale_price?: number | null;
  cost?: number | null;
  category_id?: string | null;
  status?: Product["status"];
  is_active?: boolean;
  is_featured?: boolean;
  is_carousel?: boolean;
  weight_grams?: number | null;
  video_url?: string | null;
  specifications?: Json;
  stock?: number;
  images?: string[];
}

// ============================================================
//  LECTURA
// ============================================================
export async function listAdminProducts(): Promise<AdminProductRow[]> {
  if (!isSupabaseConfigured()) return listLocalAdminProducts();
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "*, inventory(quantity), product_images(url, is_primary, position), categories(name)",
    )
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as (Product & {
    inventory: { quantity: number }[] | null;
    product_images: { url: string; is_primary: boolean; position: number }[] | null;
    categories: { name: string } | null;
  })[];

  return rows.map((p) => {
    const { inventory, product_images, categories, ...prod } = p;
    const imgs = [...(product_images ?? [])].sort(
      (a, b) => a.position - b.position,
    );
    const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
    return {
      ...(prod as Product),
      stock: inventory?.[0]?.quantity ?? 0,
      image: primary?.url ?? null,
      category_name: categories?.name ?? null,
    };
  });
}

export async function getAdminProduct(id: string): Promise<{
  product: Product;
  images: ProductImage[];
  stock: number;
} | null> {
  if (!isSupabaseConfigured()) return getLocalAdminProduct(id);
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(*), inventory(quantity)")
    .eq("id", id)
    .single();
  if (!data) return null;
  const row = data as Product & {
    product_images: ProductImage[] | null;
    inventory: { quantity: number }[] | null;
  };
  const { product_images, inventory, ...product } = row;
  return {
    product: product as Product,
    images: [...(product_images ?? [])].sort((a, b) => a.position - b.position),
    stock: inventory?.[0]?.quantity ?? 0,
  };
}

// ============================================================
//  ESCRITURA
// ============================================================
export async function createProduct(input: ProductInput): Promise<string> {
  if (!isSupabaseConfigured()) return createLocalProduct(input).id;
  const supabase = await createClient();
  const slug = await uniqueSlugRemote(slugify(input.name) || "producto");

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      slug,
      sku: input.sku ?? null,
      barcode: input.barcode ?? null,
      brand: input.brand ?? null,
      supplier: input.supplier ?? null,
      short_description: input.short_description ?? null,
      description: input.description ?? null,
      specifications: input.specifications ?? {},
      price: input.price,
      sale_price: input.sale_price ?? null,
      cost: input.cost ?? null,
      currency: "COP",
      weight_grams: input.weight_grams ?? null,
      status: input.status ?? "available",
      is_active: input.is_active ?? true,
      is_featured: input.is_featured ?? false,
      is_carousel: input.is_carousel ?? false,
      category_id: input.category_id ?? null,
      video_url: input.video_url ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  const productId = (data as { id: string }).id;

  await insertImages(productId, input.name, input.images);

  const { error: invError } = await supabase.from("inventory").insert({
    product_id: productId,
    variant_id: null,
    quantity: input.stock ?? 0,
    low_stock_threshold: 5,
  });
  if (invError) throw invError;

  return productId;
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    updateLocalProduct(id, input);
    return;
  }
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("products")
    .select("name, slug")
    .eq("id", id)
    .single();
  const cur = current as { name: string; slug: string } | null;

  const patch: Database["tienda"]["Tables"]["products"]["Update"] = {
    name: input.name,
    sku: input.sku ?? null,
    barcode: input.barcode ?? null,
    brand: input.brand ?? null,
    supplier: input.supplier ?? null,
    short_description: input.short_description ?? null,
    description: input.description ?? null,
    price: input.price,
    sale_price: input.sale_price ?? null,
    cost: input.cost ?? null,
    status: input.status,
    is_active: input.is_active,
    is_featured: input.is_featured,
    weight_grams: input.weight_grams ?? null,
    video_url: input.video_url ?? null,
    category_id: input.category_id ?? null,
  };
  if (input.is_carousel != null) patch.is_carousel = input.is_carousel;
  if (input.specifications != null) patch.specifications = input.specifications;
  if (cur && cur.name !== input.name) {
    patch.slug = await uniqueSlugRemote(slugify(input.name) || "producto", id);
  }

  const { error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id);
  if (error) throw error;

  if (input.images) {
    await supabase.from("product_images").delete().eq("product_id", id);
    await insertImages(id, input.name, input.images);
  }

  if (input.stock != null) {
    const { data: inv } = await supabase
      .from("inventory")
      .select("id")
      .eq("product_id", id)
      .is("variant_id", null)
      .maybeSingle();
    if (inv) {
      await supabase
        .from("inventory")
        .update({ quantity: input.stock })
        .eq("id", (inv as { id: string }).id);
    } else {
      await supabase.from("inventory").insert({
        product_id: id,
        variant_id: null,
        quantity: input.stock,
        low_stock_threshold: 5,
      });
    }
  }
}

export async function deleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    deleteLocalProduct(id);
    return;
  }
  const supabase = await createClient();
  // FK ON DELETE CASCADE elimina imágenes e inventario asociados
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateProduct(id: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return duplicateLocalProduct(id)?.id ?? null;
  const src = await getAdminProduct(id);
  if (!src) return null;
  return createProduct({
    name: `${src.product.name} (copia)`,
    sku: src.product.sku ? `${src.product.sku}-COPY` : null,
    brand: src.product.brand,
    supplier: src.product.supplier,
    short_description: src.product.short_description,
    description: src.product.description,
    specifications: src.product.specifications,
    price: src.product.price,
    sale_price: src.product.sale_price,
    cost: src.product.cost,
    category_id: src.product.category_id,
    status: src.product.status,
    is_active: false,
    is_featured: false,
    stock: src.stock,
    images: src.images.map((i) => i.url),
  });
}

export async function toggleProductActive(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    toggleLocalProductActive(id);
    return;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("is_active")
    .eq("id", id)
    .single();
  const p = data as { is_active: boolean } | null;
  if (!p) return;
  const { error } = await supabase
    .from("products")
    .update({ is_active: !p.is_active })
    .eq("id", id);
  if (error) throw error;
}

async function insertImages(
  productId: string,
  alt: string,
  images?: string[],
): Promise<void> {
  const urls = (images ?? []).filter(Boolean);
  if (urls.length === 0) return;
  const supabase = await createClient();
  const rows = urls.map((url, i) => ({
    product_id: productId,
    url,
    alt,
    is_primary: i === 0,
    position: i,
  }));
  const { error } = await supabase.from("product_images").insert(rows);
  if (error) throw error;
}

async function uniqueSlugRemote(base: string, ignoreId?: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, slug")
    .ilike("slug", `${base}%`);
  const rows = (data ?? []) as { id: string; slug: string }[];
  const taken = new Set(
    rows.filter((r) => r.id !== ignoreId).map((r) => r.slug),
  );
  let slug = base;
  let n = 1;
  while (taken.has(slug)) slug = `${base}-${++n}`;
  return slug;
}

// ============================================================
//  MODO LOCAL
// ============================================================
function uniqueSlugLocal(name: string, ignoreId?: string): string {
  const base = slugify(name) || "producto";
  const d = db();
  let slug = base;
  let n = 1;
  while (d.products.some((p) => p.slug === slug && p.id !== ignoreId)) {
    slug = `${base}-${++n}`;
  }
  return slug;
}

function listLocalAdminProducts(): AdminProductRow[] {
  const d = db();
  return [...d.products]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((p) => {
      const inv = d.inventory.find((i) => i.product_id === p.id);
      const img =
        d.product_images.find((i) => i.product_id === p.id && i.is_primary) ??
        d.product_images.find((i) => i.product_id === p.id);
      const cat = d.categories.find((c) => c.id === p.category_id);
      return {
        ...p,
        stock: inv?.quantity ?? 0,
        image: img?.url ?? null,
        category_name: cat?.name ?? null,
      };
    });
}

function getLocalAdminProduct(id: string) {
  const d = db();
  const product = d.products.find((p) => p.id === id);
  if (!product) return null;
  const images = d.product_images
    .filter((i) => i.product_id === id)
    .sort((a, b) => a.position - b.position);
  const inv = d.inventory.find((i) => i.product_id === id);
  return { product, images, stock: inv?.quantity ?? 0 };
}

function createLocalProduct(input: ProductInput): Product {
  const id = uid("prod");
  const slug = uniqueSlugLocal(input.name);
  return mutate((d) => {
    const product: Product = {
      id,
      name: input.name,
      slug,
      sku: input.sku ?? null,
      barcode: input.barcode ?? null,
      brand: input.brand ?? null,
      supplier: input.supplier ?? null,
      short_description: input.short_description ?? null,
      description: input.description ?? null,
      specifications: input.specifications ?? {},
      price: input.price,
      sale_price: input.sale_price ?? null,
      cost: input.cost ?? null,
      currency: "COP",
      weight_grams: input.weight_grams ?? null,
      length_cm: null,
      width_cm: null,
      height_cm: null,
      status: input.status ?? "available",
      is_active: input.is_active ?? true,
      is_featured: input.is_featured ?? false,
      is_carousel: input.is_carousel ?? false,
      category_id: input.category_id ?? null,
      video_url: input.video_url ?? null,
      rating_avg: 0,
      rating_count: 0,
      sold_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    d.products.push(product);

    (input.images ?? []).filter(Boolean).forEach((url, i) => {
      const img: ProductImage = {
        id: uid("img"),
        product_id: id,
        url,
        alt: input.name,
        is_primary: i === 0,
        position: i,
        created_at: new Date().toISOString(),
      };
      d.product_images.push(img);
    });

    d.inventory.push({
      id: uid("inv"),
      product_id: id,
      variant_id: null,
      quantity: input.stock ?? 0,
      low_stock_threshold: 5,
      updated_at: new Date().toISOString(),
    });

    return product;
  });
}

function updateLocalProduct(id: string, input: ProductInput): Product | null {
  return mutate((d) => {
    const product = d.products.find((p) => p.id === id);
    if (!product) return null;
    Object.assign(product, {
      name: input.name,
      slug: input.name !== product.name ? uniqueSlugLocal(input.name, id) : product.slug,
      sku: input.sku ?? null,
      barcode: input.barcode ?? null,
      brand: input.brand ?? null,
      supplier: input.supplier ?? null,
      short_description: input.short_description ?? null,
      description: input.description ?? null,
      specifications: input.specifications ?? product.specifications,
      price: input.price,
      sale_price: input.sale_price ?? null,
      cost: input.cost ?? null,
      status: input.status ?? product.status,
      is_active: input.is_active ?? product.is_active,
      is_featured: input.is_featured ?? product.is_featured,
      is_carousel: input.is_carousel ?? product.is_carousel ?? false,
      weight_grams: input.weight_grams ?? null,
      video_url: input.video_url ?? null,
      category_id: input.category_id ?? null,
      updated_at: new Date().toISOString(),
    });

    if (input.images) {
      d.product_images = d.product_images.filter((i) => i.product_id !== id);
      input.images.filter(Boolean).forEach((url, i) => {
        d.product_images.push({
          id: uid("img"),
          product_id: id,
          url,
          alt: input.name,
          is_primary: i === 0,
          position: i,
          created_at: new Date().toISOString(),
        });
      });
    }

    if (input.stock != null) {
      const inv = d.inventory.find((i) => i.product_id === id);
      if (inv) inv.quantity = input.stock;
    }

    return product;
  });
}

function deleteLocalProduct(id: string) {
  mutate((d) => {
    d.products = d.products.filter((p) => p.id !== id);
    d.product_images = d.product_images.filter((i) => i.product_id !== id);
    d.inventory = d.inventory.filter((i) => i.product_id !== id);
  });
}

function duplicateLocalProduct(id: string): Product | null {
  const src = getLocalAdminProduct(id);
  if (!src) return null;
  return createLocalProduct({
    name: `${src.product.name} (copia)`,
    sku: src.product.sku ? `${src.product.sku}-COPY` : null,
    brand: src.product.brand,
    supplier: src.product.supplier,
    short_description: src.product.short_description,
    description: src.product.description,
    specifications: src.product.specifications,
    price: src.product.price,
    sale_price: src.product.sale_price,
    cost: src.product.cost,
    category_id: src.product.category_id,
    status: src.product.status,
    is_active: false,
    is_featured: false,
    stock: src.stock,
    images: src.images.map((i) => i.url),
  });
}

function toggleLocalProductActive(id: string) {
  mutate((d) => {
    const p = d.products.find((x) => x.id === id);
    if (p) {
      p.is_active = !p.is_active;
      p.updated_at = new Date().toISOString();
    }
  });
}
