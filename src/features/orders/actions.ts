"use server";

import { z } from "zod";
import { isWompiConfigured } from "@/lib/env";
import { fetchWompiTransaction } from "@/lib/payments/wompi-provider";
import { getCurrentUser } from "@/features/auth/api";
import {
  confirmOrderPayment,
  createOrder,
  createPaymentSession,
  failOrderPayment,
  getOrderForPayment,
  validateCoupon,
} from "./api";
import { type CheckoutInput } from "./local";
import { couponDiscount } from "./pricing";
import type { OrderStatus } from "@/types/database.types";

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
  | { ok: true; redirect: string; external: boolean }
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

    // Con Wompi: redirige a la pasarela. El pedido queda 'pending' y se
    // confirma por webhook/retorno. Sin pasarela: pago simulado -> éxito.
    if (isWompiConfigured()) {
      const url = await createPaymentSession(order, {
        name: parsed.data.address.full_name,
      });
      return { ok: true, redirect: url, external: true };
    }
    return {
      ok: true,
      redirect: `/checkout/exito?order=${order.order_number}`,
      external: false,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo crear el pedido",
    };
  }
}

/**
 * Finaliza el retorno desde Wompi. Verifica la transacción contra la API de
 * Wompi y confirma/rechaza el pedido (idempotente: seguro aunque el webhook
 * ya lo haya hecho). Permite que el flujo funcione también en local, donde el
 * webhook no puede alcanzar `localhost`.
 */
export async function finalizeWompiReturnAction(
  orderNumber: string,
  transactionId: string | null,
): Promise<{ status: OrderStatus | "unknown" }> {
  if (!isWompiConfigured()) return { status: "unknown" };

  const order = await getOrderForPayment(orderNumber);
  if (!order) return { status: "unknown" };
  if (order.status !== "pending") return { status: order.status };
  if (!transactionId) return { status: "pending" };

  const tx = await fetchWompiTransaction(transactionId);
  if (!tx) return { status: "pending" };

  // Seguridad: la transacción debe corresponder a este pedido y a su monto.
  if (tx.reference !== orderNumber) return { status: "pending" };
  if (Math.round(order.total * 100) !== tx.amount_in_cents) {
    return { status: "pending" };
  }

  const amount = (tx.amount_in_cents ?? 0) / 100;
  if (tx.status === "APPROVED") {
    return { status: await confirmOrderPayment(order.id, tx.id, amount) };
  }
  if (tx.status === "DECLINED" || tx.status === "VOIDED" || tx.status === "ERROR") {
    return { status: await failOrderPayment(order.id, tx.id, amount) };
  }
  return { status: "pending" };
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
