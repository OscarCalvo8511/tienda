"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getCurrentProfile } from "@/features/auth/api";

const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().min(3, "Escribe tu opinión").max(1000),
});

export type CreateReviewResult =
  | { ok: true }
  | { ok: false; error: string };

/** Crea una reseña (requiere sesión). Queda pendiente de aprobación del admin. */
export async function createReviewAction(
  raw: unknown,
): Promise<CreateReviewResult> {
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Debes iniciar sesión para dejar una reseña" };
  }

  const supabase = await createClient();

  // Una reseña por usuario y producto.
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("product_id", parsed.data.productId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    return { ok: false, error: "Ya dejaste una reseña para este producto" };
  }

  const { error } = await supabase.from("reviews").insert({
    product_id: parsed.data.productId,
    user_id: user.id,
    rating: parsed.data.rating,
    title: parsed.data.title || null,
    comment: parsed.data.comment,
    is_approved: false,
  });
  if (error) {
    return { ok: false, error: "No se pudo enviar la reseña" };
  }

  revalidatePath("/producto/[slug]", "page");
  return { ok: true };
}

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") throw new Error("No autorizado");
  return profile;
}

/** Aprueba (publica) una reseña pendiente. */
export async function approveReviewAction(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ is_approved: true })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/resenas");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Elimina una reseña (pendiente o publicada). */
export async function deleteReviewAction(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/resenas");
  revalidatePath("/", "layout");
  return { ok: true };
}
