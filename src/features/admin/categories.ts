import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { db, mutate, uid } from "@/lib/local/store";
import { slugify } from "@/lib/utils";
import type { Category, Database } from "@/types/database.types";

export interface CategoryInput {
  name: string;
  description?: string | null;
  parent_id?: string | null;
  position?: number;
  is_active?: boolean;
}

export interface AdminCategoryRow extends Category {
  parent_name: string | null;
  product_count: number;
}

// ============================================================
//  LECTURA
// ============================================================
export async function listAdminCategories(): Promise<AdminCategoryRow[]> {
  if (!isSupabaseConfigured()) return listLocalAdminCategories();
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("position", { ascending: true });

  const rows = (data ?? []) as (Category & {
    products: { count: number }[] | null;
  })[];

  return rows.map((c) => {
    const { products, ...cat } = c;
    return {
      ...(cat as Category),
      parent_name: c.parent_id
        ? rows.find((p) => p.id === c.parent_id)?.name ?? null
        : null,
      product_count: products?.[0]?.count ?? 0,
    };
  });
}

// ============================================================
//  ESCRITURA
// ============================================================
export async function createCategory(input: CategoryInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    createLocalCategory(input);
    return;
  }
  const supabase = await createClient();
  const slug = await uniqueSlugRemote(slugify(input.name) || "categoria");

  let position = input.position;
  if (position == null) {
    const { count } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true });
    position = (count ?? 0) + 1;
  }

  const { error } = await supabase.from("categories").insert({
    name: input.name,
    slug,
    description: input.description ?? null,
    parent_id: input.parent_id ?? null,
    position,
    is_active: input.is_active ?? true,
  });
  if (error) throw error;
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    updateLocalCategory(id, input);
    return;
  }
  const supabase = await createClient();

  const patch: Database["tienda"]["Tables"]["categories"]["Update"] = {
    description: input.description ?? null,
    parent_id: input.parent_id ?? null,
  };
  if (input.name) patch.name = input.name;
  if (input.position != null) patch.position = input.position;
  if (input.is_active != null) patch.is_active = input.is_active;

  // Recalcular slug solo si cambió el nombre
  if (input.name) {
    const { data: current } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("id", id)
      .single();
    const cur = current as { name: string; slug: string } | null;
    if (cur && cur.name !== input.name) {
      patch.slug = await uniqueSlugRemote(slugify(input.name) || "categoria", id);
    }
  }

  const { error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    deleteLocalCategory(id);
    return;
  }
  const supabase = await createClient();
  // Los FK usan ON DELETE SET NULL (productos y subcategorías quedan sin padre)
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

/** Genera un slug único consultando los existentes en Supabase. */
async function uniqueSlugRemote(base: string, ignoreId?: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
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
//  MODO LOCAL (fallback en desarrollo sin Supabase)
// ============================================================
function listLocalAdminCategories(): AdminCategoryRow[] {
  const d = db();
  return [...d.categories]
    .sort((a, b) => a.position - b.position)
    .map((c) => ({
      ...c,
      parent_name: c.parent_id
        ? d.categories.find((p) => p.id === c.parent_id)?.name ?? null
        : null,
      product_count: d.products.filter((p) => p.category_id === c.id).length,
    }));
}

function uniqueSlugLocal(name: string, ignoreId?: string): string {
  const base = slugify(name) || "categoria";
  const d = db();
  let slug = base;
  let n = 1;
  while (d.categories.some((c) => c.slug === slug && c.id !== ignoreId)) {
    slug = `${base}-${++n}`;
  }
  return slug;
}

function createLocalCategory(input: CategoryInput): Category {
  const id = uid("cat");
  return mutate((d) => {
    const cat: Category = {
      id,
      name: input.name,
      slug: uniqueSlugLocal(input.name),
      description: input.description ?? null,
      image_url: null,
      parent_id: input.parent_id ?? null,
      position: input.position ?? d.categories.length + 1,
      is_active: input.is_active ?? true,
      created_at: new Date().toISOString(),
    };
    d.categories.push(cat);
    return cat;
  });
}

function updateLocalCategory(id: string, input: CategoryInput) {
  mutate((d) => {
    const cat = d.categories.find((c) => c.id === id);
    if (!cat) return;
    if (input.name && input.name !== cat.name) {
      cat.name = input.name;
      cat.slug = uniqueSlugLocal(input.name, id);
    }
    cat.description = input.description ?? cat.description;
    cat.parent_id = input.parent_id ?? null;
    if (input.position != null) cat.position = input.position;
    if (input.is_active != null) cat.is_active = input.is_active;
  });
}

function deleteLocalCategory(id: string) {
  mutate((d) => {
    d.products.forEach((p) => {
      if (p.category_id === id) p.category_id = null;
    });
    d.categories.forEach((c) => {
      if (c.parent_id === id) c.parent_id = null;
    });
    d.categories = d.categories.filter((c) => c.id !== id);
  });
}
