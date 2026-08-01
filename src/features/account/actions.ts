"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/features/auth/api";
import {
  updateProfileLocal,
  changePasswordLocal,
  saveAddressLocal,
  deleteAddressLocal,
  getProductsByIdsLocal,
  getReorderLinesLocal,
  type AddressInput,
  type ReorderLine,
} from "./local";
import type { ProductWithImage } from "@/features/products/api";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");
  return user;
}

export async function updateProfileAction(data: {
  full_name: string;
  phone: string;
}) {
  const user = await requireUser();
  if (!isSupabaseConfigured()) {
    updateProfileLocal(user.id, data);
    revalidatePath("/cuenta");
    return { ok: true };
  }
  return { ok: false, error: "No disponible" };
}

export async function changePasswordAction(data: {
  current: string;
  next: string;
}) {
  const user = await requireUser();
  if (!z.string().min(6).safeParse(data.next).success) {
    return { ok: false, error: "La nueva contraseña debe tener 6+ caracteres" };
  }
  if (!isSupabaseConfigured()) {
    return changePasswordLocal(user.id, data.current, data.next);
  }
  return { ok: false, error: "No disponible" };
}

export async function saveAddressAction(input: AddressInput, id?: string) {
  const user = await requireUser();
  if (!isSupabaseConfigured()) {
    saveAddressLocal(user.id, input, id);
    revalidatePath("/cuenta/direcciones");
    return { ok: true };
  }
  return { ok: false, error: "No disponible" };
}

export async function deleteAddressAction(id: string) {
  const user = await requireUser();
  if (!isSupabaseConfigured()) {
    deleteAddressLocal(user.id, id);
    revalidatePath("/cuenta/direcciones");
    return { ok: true };
  }
  return { ok: false, error: "No disponible" };
}

/** Para la lista de favoritos (ids vienen del cliente). */
export async function getFavoriteProductsAction(
  ids: string[],
): Promise<ProductWithImage[]> {
  if (!isSupabaseConfigured()) return getProductsByIdsLocal(ids);
  return [];
}

/** Líneas para repetir una compra anterior. */
export async function getReorderLinesAction(
  orderNumber: string,
): Promise<ReorderLine[]> {
  const user = await requireUser();
  if (!isSupabaseConfigured())
    return getReorderLinesLocal(user.id, orderNumber);
  return [];
}
