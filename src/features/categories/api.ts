import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import * as local from "@/lib/local/queries";
import type { Category } from "@/types/database.types";

export type CategoryTree = Category & { children: Category[] };

/** Devuelve las categorías activas organizadas en árbol (padre → hijas). */
export async function getCategoryTree(): Promise<CategoryTree[]> {
  if (!isSupabaseConfigured()) return local.localGetCategoryTree();
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true });

  const cats = (data ?? []) as Category[];
  const parents = cats.filter((c) => !c.parent_id);
  return parents.map((p) => ({
    ...p,
    children: cats.filter((c) => c.parent_id === p.id),
  }));
}

export async function getAllCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return local.localGetAllCategories();
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("position", { ascending: true });
  return (data ?? []) as Category[];
}
