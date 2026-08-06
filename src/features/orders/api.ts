import "server-only";
import { env, isSupabaseConfigured, isWompiConfigured } from "@/lib/env";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments/provider";
import { effectivePrice } from "@/lib/utils";
import { getSettings } from "@/features/settings/api";
import { computeTotals } from "./pricing";
import { notifyOrderCreated, notifyOrderStatus } from "./emails";
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

/**
 * Lee un pedido por su número con el cliente admin (sin sesión). Se usa en la
 * página de confirmación para que un comprador invitado pueda ver su pedido
 * recién hecho. Solo se muestran datos no sensibles (ítems y totales).
 */
export async function getOrderByNumberPublic(
  orderNumber: string,
): Promise<{ order: Order; items: OrderItem[] } | null> {
  if (!isSupabaseConfigured()) return getLocalOrderByNumber(orderNumber);
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!order) return null;
  const { data: items } = await admin
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
    .update({ status })
    .eq("id", orderId);
  if (error) throw error;
  // Notifica al cliente el nuevo estado (preparando, enviado, entregado, etc.).
  await notifyOrderStatus(orderId, status);
}

/**
 * Crea un pedido en Supabase re-preciando desde la base (evita manipulación
 * del cliente).
 *
 * - Con Wompi configurado: el pedido nace 'pending'. El inventario, el
 *   `sold_count` y el uso de cupón se aplican al CONFIRMAR el pago
 *   (webhook o página de retorno), no aquí. Ver `confirmOrderPayment`.
 * - Sin pasarela (modo demo): pago simulado 'paid', descontando inventario
 *   y registrando la venta de inmediato.
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
    shippingMethodId: input.shippingMethodId,
    freeShippingThreshold: settings.shipping.free_threshold,
    taxRate: settings.tax.rate,
    taxIncluded: settings.tax.included,
  });

  const wompi = isWompiConfigured();

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: input.userId ?? null,
      status: wompi ? "pending" : "paid",
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
    })
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
    .insert(itemRows);
  if (itemsError) throw itemsError;

  // Con pasarela real, el inventario y la venta se registran al confirmar el
  // pago (webhook/retorno). En modo demo, se hace ya con pago simulado.
  if (!wompi) {
    for (const p of priced) {
      await supabase.rpc("adjust_inventory", {
        p_product_id: p.product.id,
        p_delta: -p.quantity,
        p_type: "sale",
        p_reason: `Venta ${order.order_number}`,
        p_variant_id: undefined,
      });
    }
    await supabase.rpc("register_sale", { p_order_id: order.id });
  }

  // Guarda la dirección del comprador para precargarla en la próxima compra
  // (no bloquea el pedido si falla).
  if (input.userId) {
    await saveCheckoutAddress(supabase, input.userId, input.address, input.customer.phone);
  }

  // Correo de "pedido creado" (no bloquea ni falla el pedido si el envío falla).
  await notifyOrderCreated(order.id);

  return order;
}

/**
 * Guarda (o refresca) la dirección usada en el checkout como predeterminada del
 * usuario, para precargarla en compras futuras. Idempotente y tolerante a
 * fallos: nunca lanza.
 */
async function saveCheckoutAddress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  address: CheckoutInput["address"],
  phone: string,
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", userId)
      .eq("line1", address.line1)
      .eq("city", address.city)
      .maybeSingle();

    // La dirección usada pasa a ser la predeterminada.
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", userId);

    if (existing) {
      await supabase
        .from("addresses")
        .update({
          is_default: true,
          full_name: address.full_name,
          phone,
          line2: address.line2 ?? null,
          department: address.department,
        })
        .eq("id", (existing as { id: string }).id);
    } else {
      await supabase.from("addresses").insert({
        user_id: userId,
        full_name: address.full_name,
        phone,
        line1: address.line1,
        line2: address.line2 ?? null,
        city: address.city,
        department: address.department,
        country: "Colombia",
        is_default: true,
      });
    }
  } catch (err) {
    console.error("[orders] no se pudo guardar la dirección:", err);
  }
}

// ============================================================
//  PASARELA DE PAGO (Wompi)
// ============================================================

/**
 * Crea la sesión de pago en la pasarela y devuelve la URL a la que redirigir
 * al cliente. La firma de integridad se genera en servidor.
 */
export async function createPaymentSession(
  order: Order,
  customer: { name?: string | null },
): Promise<string> {
  const provider = getPaymentProvider("wompi");
  const { redirectUrl } = await provider.createCheckout({
    orderId: order.id,
    orderNumber: order.order_number,
    currency: order.currency,
    amount: Number(order.total),
    lines: [],
    shippingAmount: Number(order.shipping_total),
    discountAmount: Number(order.discount_total),
    customerEmail: order.customer_email,
    customerName: customer.name ?? null,
    customerPhone: order.customer_phone,
    successUrl: `${env.siteUrl}/checkout/retorno/${encodeURIComponent(order.order_number)}`,
    cancelUrl: `${env.siteUrl}/carrito`,
  });
  return redirectUrl;
}

/** Busca un pedido por su número usando el cliente admin (sin sesión, para webhook/retorno). */
export async function getOrderForPayment(
  orderNumber: string,
): Promise<{ id: string; total: number; status: OrderStatus } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("id, total, status")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, total: Number(data.total), status: data.status };
}

/** Confirma el pago (atómico e idempotente vía RPC). Devuelve el estado final. */
export async function confirmOrderPayment(
  orderId: string,
  providerRef: string,
  amount: number,
): Promise<OrderStatus> {
  const admin = createAdminClient();
  const { data: before } = await admin
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();
  const wasPending =
    (before as { status: OrderStatus } | null)?.status === "pending";
  const { data, error } = await admin.rpc("confirm_order_payment", {
    p_order_id: orderId,
    p_provider: "wompi",
    p_provider_ref: providerRef,
    p_amount: amount,
  });
  if (error) throw error;
  const finalStatus = data as OrderStatus;
  // Solo notifica en la transición real (evita correos duplicados si el webhook
  // y la página de retorno confirman el mismo pago).
  if (wasPending && finalStatus === "paid") {
    await notifyOrderStatus(orderId, finalStatus);
  }
  return finalStatus;
}

/** Marca un intento de pago fallido/anulado (idempotente). */
export async function failOrderPayment(
  orderId: string,
  providerRef: string,
  amount: number,
  newStatus: OrderStatus = "cancelled",
): Promise<OrderStatus> {
  const admin = createAdminClient();
  const { data: before } = await admin
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();
  const wasPending =
    (before as { status: OrderStatus } | null)?.status === "pending";
  const { data, error } = await admin.rpc("fail_order_payment", {
    p_order_id: orderId,
    p_provider: "wompi",
    p_provider_ref: providerRef,
    p_amount: amount,
    p_new_status: newStatus,
  });
  if (error) throw error;
  const finalStatus = data as OrderStatus;
  if (wasPending) await notifyOrderStatus(orderId, finalStatus);
  return finalStatus;
}
