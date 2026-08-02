import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export interface ReviewDisplay {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  authorName: string;
}

export interface PendingReview extends ReviewDisplay {
  productName: string;
  productSlug: string;
}

function displayName(
  profileName: string | null | undefined,
  authorName: string | null,
): string {
  const name = profileName ?? authorName ?? "Cliente";
  return name.trim() || "Cliente";
}

/** Reseñas aprobadas de un producto (más recientes primero). */
export async function getProductReviews(
  productId: string,
): Promise<ReviewDisplay[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, title, comment, created_at, author_name, profiles(full_name)")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    created_at: string;
    author_name: string | null;
    profiles: { full_name: string | null } | null;
  }[];

  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    createdAt: r.created_at,
    authorName: displayName(r.profiles?.full_name, r.author_name),
  }));
}

/** Reseñas pendientes de aprobación (admin). */
export async function getPendingReviews(): Promise<PendingReview[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(
      "id, rating, title, comment, created_at, author_name, products(name, slug), profiles(full_name)",
    )
    .eq("is_approved", false)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    created_at: string;
    author_name: string | null;
    products: { name: string; slug: string } | null;
    profiles: { full_name: string | null } | null;
  }[];

  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    createdAt: r.created_at,
    authorName: displayName(r.profiles?.full_name, r.author_name),
    productName: r.products?.name ?? "Producto",
    productSlug: r.products?.slug ?? "",
  }));
}
