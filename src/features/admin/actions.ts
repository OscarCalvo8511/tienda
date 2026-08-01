"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/features/auth/api";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  toggleProductActive,
  type ProductInput,
} from "./products";
import { adjustInventory, type InventoryAdjustInput } from "./inventory";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryInput,
} from "./categories";
import { createCoupon, deleteCoupon, type CouponInput } from "./coupons";
import { toggleCustomerBlocked, deleteCustomer } from "./customers";
import { updateSettings, type SettingsInput } from "./settings";
import { updateOrderStatus } from "@/features/orders/api";
import type { OrderStatus } from "@/types/database.types";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("No autorizado");
  }
  return profile;
}

function revalidateStore() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

// ---------- Productos ----------
export async function saveProductAction(input: ProductInput, id?: string) {
  await requireAdmin();
  if (id) await updateProduct(id, input);
  else await createProduct(input);
  revalidateStore();
  return { ok: true };
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  await deleteProduct(id);
  revalidateStore();
  return { ok: true };
}

export async function duplicateProductAction(id: string) {
  await requireAdmin();
  const newId = await duplicateProduct(id);
  revalidateStore();
  return { ok: true, id: newId ?? undefined };
}

export async function toggleProductActiveAction(id: string) {
  await requireAdmin();
  await toggleProductActive(id);
  revalidateStore();
  return { ok: true };
}

// ---------- Inventario ----------
export async function adjustInventoryAction(input: InventoryAdjustInput) {
  const admin = await requireAdmin();
  await adjustInventory({ ...input, createdBy: admin.id });
  revalidateStore();
  return { ok: true };
}

// ---------- Categorías ----------
export async function saveCategoryAction(input: CategoryInput, id?: string) {
  await requireAdmin();
  if (id) await updateCategory(id, input);
  else await createCategory(input);
  revalidateStore();
  return { ok: true };
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();
  await deleteCategory(id);
  revalidateStore();
  return { ok: true };
}

// ---------- Pedidos ----------
export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
) {
  const admin = await requireAdmin();
  await updateOrderStatus(orderId, status, admin.id);
  revalidatePath("/admin/pedidos");
  return { ok: true };
}

// ---------- Cupones ----------
export async function saveCouponAction(input: CouponInput) {
  await requireAdmin();
  await createCoupon(input);
  revalidatePath("/admin/cupones");
  return { ok: true };
}

export async function deleteCouponAction(id: string) {
  await requireAdmin();
  await deleteCoupon(id);
  revalidatePath("/admin/cupones");
  return { ok: true };
}

// ---------- Clientes ----------
export async function toggleCustomerBlockedAction(id: string) {
  await requireAdmin();
  await toggleCustomerBlocked(id);
  revalidatePath("/admin/clientes");
  return { ok: true };
}

export async function deleteCustomerAction(id: string) {
  await requireAdmin();
  await deleteCustomer(id);
  revalidatePath("/admin/clientes");
  return { ok: true };
}

// ---------- Configuración ----------
export async function saveSettingsAction(input: SettingsInput) {
  await requireAdmin();
  await updateSettings(input);
  revalidateStore();
  return { ok: true };
}
