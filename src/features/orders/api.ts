import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { effectivePrice } from "@/lib/utils";
import { getSettings } from "@/features/settings/api";
import { computeTotals } from "./pricing";
import {
  getLocalOrderByNumber,
  getLocalOrdersByUser,
  getAllLocalOrders,
  getLocalOrderDetail,
  createLocalOrder,
  validateLocalCoupon,
  updateLocalOrderStatus,
  type CheckoutInput,
} from "./local";
import type {
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusHistory,
  Coupon,
  Product,
} from "@/types/database.types";

export async function getOrderByNumber(
  orderNumber: string,
): Promise<{ order: Order; items: OrderItem[] } | null> {
  if (!isSupabaseConfigured()) return getLocalOrderByNumber(orderNumber);

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .single();
  if (!order) return null;
  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", (order as Order).id);
  return { order: order as Order, items: (items ?? []) as OrderItem[] };
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  if (!isSupabaseConfigured()) return getLocalOrdersByUser(userId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Order[];
}

export async function getOrderDetail(orderNumber: string): Promise<{
  order: Order;
  items: OrderItem[];
  history: OrderStatusHistory[];
} | null> {
  if (!isSupabaseConfigured()) return getLocalOrderDetail(orderNumber);
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .single();
  if (!order) return null;
  const o = order as Order;
  const [{ data: items }, { data: history }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", o.id),
    supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", o.id)
      .order("created_at", { ascending: true }),
  ]);
  return {
    order: o,
    items: (items ?? []) as OrderItem[],
    history: (history ?? []) as OrderStatusHistory[],
  };
}

export async function getAllOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) return getAllLocalOrders();
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Order[];
}

// ============================================================
//  ESCRITURA
// ============================================================

/** Valida un cupón activo y vigente. */
export async function validateCoupon(code: string): Promise<Coupon | null> {
  if (!isSupabaseConfigured()) return validateLocalCoupon(code);
  const supabase = await createClient();
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .ilike("code", code.trim())
    .eq("is_active", true)
    .maybeSingle();
  const coupon = data as Coupon | null;
  if (!coupon) return null;
  const nowIso = new Date().toISOString();
  if (coupon.starts_at && coupon.starts_at > nowIso) return null;
  if (coupon.expires_at && coupon.expires_at < nowIso) return null;
  if (coupon.max_uses != null && coupon.uses_count >= coupon.max_uses)
    return null;
  return coupon;
}

/** Cambia el estado de un pedido (admin). El historial lo registra un trigger. */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  changedBy?: string | null,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    updateLocalOrderStatus(orderId, status, changedBy);
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status } as never)
    .eq("id", orderId);
  if (error) throw error;
}

/**
 * Crea un pedido en Supabase con pago simulado (marcado 'paid').
 * Re-precia desde la base para evitar manipulación del cliente y descuenta
 * inventario vía la RPC adjust_inventory (SECURITY DEFINER).
 */
export async function createOrder(input: CheckoutInput): Promise<Order> {
  if (!isSupabaseConfigured()) return createLocalOrder(input);
  const supabase = await createClient();
  const settings = await getSettings();
  const method = settings.shipping.methods.find(
    (m) => m.id === input.shippingMethodId,
  );
  const coupon = input.couponCode ? await validateCoupon(input.couponCode) : null;

  const ids = input.items.map((i) => i.productId);
  const { data: prodData } = await supabase
    .from("products")
    .select("id, name, sku, price, sale_price")
    .in("id", ids);
  const products = (prodData ?? []) as Pick<
    Product,
    "id" | "name" | "sku" | "price" | "sale_price"
  >[];

  const priced = input.items
    .map((it) => {
      const p = products.find((x) => x.id === it.productId);
      if (!p) return null;
      return {
        product: p,
        variantId: it.variantId ?? null,
        quantity: Math.max(1, it.quantity),
        price: effectivePrice(Number(p.price), p.sale_price ?? null),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (priced.length === 0) throw new Error("No hay productos válidos en el pedido");

  const totals = computeTotals({
    items: priced.map((p) => ({ price: p.price, quantity: p.quantity })),
    coupon,
    shippingCost: method?.price ?? 0,
    freeShippingThreshold: settings.shipping.free_threshold,
    taxRate: settings.tax.rate,
    taxIncluded: settings.tax.included,
  });

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: input.userId ?? null,
      status: "paid",
      subtotal: totals.subtotal,
      discount_total: totals.discount,
      shipping_total: totals.shipping,
      tax_total: totals.tax,
      total: totals.total,
      currency: "COP",
      coupon_id: coupon?.id ?? null,
      shipping_method: method?.name ?? null,
      shipping_address: { ...input.address, phone: input.customer.phone },
      customer_email: input.customer.email,
      customer_phone: input.customer.phone,
      notes: input.notes ?? null,
    } as never)
    .select("*")
    .single();
  if (orderError) throw orderError;
  const order = orderData as Order;

  const itemRows = priced.map((p) => ({
    order_id: order.id,
    product_id: p.product.id,
    variant_id: p.variantId,
    product_name: p.product.name,
    sku: p.product.sku,
    unit_price: p.price,
    quantity: p.quantity,
    line_total: p.price * p.quantity,
  }));
  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemRows as never);
  if (itemsError) throw itemsError;

  // Descontar inventario (la RPC registra el movimiento y ajusta el estado)
  for (const p of priced) {
    await supabase.rpc("adjust_inventory", {
      p_product_id: p.product.id,
      p_delta: -p.quantity,
      p_type: "sale",
      p_reason: `Venta ${order.order_number}`,
      p_variant_id: null,
    } as never);
  }

  // Registra unidades vendidas, uso de cupón e historial de estado inicial
  await supabase.rpc("register_sale", { p_order_id: order.id } as never);

  return order;
}
