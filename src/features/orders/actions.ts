"use server";

import { z } from "zod";
import { getCurrentUser } from "@/features/auth/api";
import { createOrder, validateCoupon } from "./api";
import { type CheckoutInput } from "./local";
import { couponDiscount } from "./pricing";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().nullable().optional(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "El carrito está vacío"),
  customer: z.object({
    email: z.string().email("Correo inválido"),
    phone: z.string().min(7, "Teléfono inválido"),
  }),
  shippingMethodId: z.string().min(1),
  address: z.object({
    full_name: z.string().min(2),
    line1: z.string().min(3),
    line2: z.string().optional(),
    city: z.string().min(2),
    department: z.string().min(2),
    country: z.string().min(2),
  }),
  couponCode: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type CheckoutResult =
  | { ok: true; redirect: string }
  | { ok: false; error: string };

export async function createCheckoutAction(
  raw: unknown,
): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const user = await getCurrentUser();

  try {
    const order = await createOrder({
      ...(parsed.data as CheckoutInput),
      userId: user?.id ?? null,
    });
    return { ok: true, redirect: `/checkout/exito?order=${order.order_number}` };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo crear el pedido",
    };
  }
}

export type CouponResult =
  | { valid: true; code: string; discount: number; label: string }
  | { valid: false; message: string };

export async function validateCouponAction(
  code: string,
  subtotal: number,
): Promise<CouponResult> {
  if (!code.trim()) return { valid: false, message: "Ingresa un código" };

  const coupon = await validateCoupon(code.trim());
  if (!coupon) return { valid: false, message: "Cupón inválido o expirado" };
  if (subtotal < coupon.min_purchase)
    return {
      valid: false,
      message: `Compra mínima requerida para este cupón.`,
    };
  const discount = couponDiscount(coupon, subtotal);
  const label =
    coupon.type === "percentage"
      ? `${coupon.value}% de descuento`
      : coupon.type === "free_shipping"
        ? "Envío gratis"
        : "Descuento aplicado";
  return { valid: true, code: coupon.code, discount, label };
}
