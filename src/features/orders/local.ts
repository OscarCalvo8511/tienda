import "server-only";
import { db, mutate, uid } from "@/lib/local/store";
import { effectivePrice } from "@/lib/utils";
import { computeTotals } from "./pricing";
import type {
  Order,
  OrderItem,
  Coupon,
  OrderStatus,
} from "@/types/database.types";

export interface CheckoutItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CheckoutInput {
  userId?: string | null;
  items: CheckoutItemInput[];
  customer: { email: string; phone: string };
  shippingMethodId: string;
  address: {
    full_name: string;
    line1: string;
    line2?: string;
    city: string;
    department: string;
    country: string;
  };
  couponCode?: string | null;
  notes?: string | null;
}

/** Valida un cupón en modo local. */
export function validateLocalCoupon(code: string): Coupon | null {
  const coupon = db().coupons.find(
    (c) => c.code.toLowerCase() === code.toLowerCase() && c.is_active,
  );
  if (!coupon) return null;
  const nowIso = new Date().toISOString();
  if (coupon.starts_at && coupon.starts_at > nowIso) return null;
  if (coupon.expires_at && coupon.expires_at < nowIso) return null;
  if (coupon.max_uses != null && coupon.uses_count >= coupon.max_uses) return null;
  return coupon;
}

/** Crea un pedido en la base local y lo marca como pagado (pago simulado). */
export function createLocalOrder(input: CheckoutInput): Order {
  const database = db();
  const settings = database.settings;
  const method = settings.shipping.methods.find(
    (m) => m.id === input.shippingMethodId,
  );
  const coupon = input.couponCode ? validateLocalCoupon(input.couponCode) : null;

  // Re-precio desde el store (evita manipulación del cliente)
  const priced = input.items
    .map((it) => {
      const p = database.products.find((x) => x.id === it.productId);
      if (!p) return null;
      const price = effectivePrice(p.price, p.sale_price);
      return {
        product: p,
        variantId: it.variantId ?? null,
        quantity: Math.max(1, it.quantity),
        price,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const totals = computeTotals({
    items: priced.map((p) => ({ price: p.price, quantity: p.quantity })),
    coupon,
    shippingCost: method?.price ?? 0,
    freeShippingThreshold: settings.shipping.free_threshold,
    taxRate: settings.tax.rate,
    taxIncluded: settings.tax.included,
  });

  const orderId = uid("order");

  return mutate((d) => {
    const orderNumber = `ORD-${++d.order_seq}`;
    const order: Order = {
      id: orderId,
      order_number: orderNumber,
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    d.orders.push(order);

    for (const p of priced) {
      const item: OrderItem = {
        id: uid("oi"),
        order_id: orderId,
        product_id: p.product.id,
        variant_id: p.variantId,
        product_name: p.product.name,
        sku: p.product.sku,
        unit_price: p.price,
        quantity: p.quantity,
        line_total: p.price * p.quantity,
        created_at: new Date().toISOString(),
      };
      d.order_items.push(item);

      // Descontar inventario + movimiento
      const inv = d.inventory.find(
        (i) => i.product_id === p.product.id && i.variant_id === (p.variantId ?? null),
      );
      const prev = inv?.quantity ?? 0;
      const next = Math.max(0, prev - p.quantity);
      if (inv) inv.quantity = next;
      d.inventory_movements.push({
        id: uid("mov"),
        product_id: p.product.id,
        variant_id: p.variantId,
        type: "sale",
        quantity: -p.quantity,
        previous_qty: prev,
        new_qty: next,
        reason: `Venta ${orderNumber}`,
        created_by: input.userId ?? null,
        created_at: new Date().toISOString(),
      });

      // Incrementar vendidos + estado
      const prod = d.products.find((x) => x.id === p.product.id);
      if (prod) {
        prod.sold_count += p.quantity;
        if (next <= 0) prod.status = "out_of_stock";
      }
    }

    // Historial de estado
    d.order_status_history.push({
      id: uid("osh"),
      order_id: orderId,
      from_status: null,
      to_status: "paid",
      note: "Pago aprobado (simulado)",
      changed_by: null,
      created_at: new Date().toISOString(),
    });

    // Uso de cupón
    if (coupon) {
      const c = d.coupons.find((x) => x.id === coupon.id);
      if (c) c.uses_count += 1;
    }

    return order;
  });
}

export function getLocalOrdersByUser(userId: string): Order[] {
  return db()
    .orders.filter((o) => o.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getLocalOrderByNumber(orderNumber: string): {
  order: Order;
  items: OrderItem[];
} | null {
  const order = db().orders.find((o) => o.order_number === orderNumber);
  if (!order) return null;
  const items = db().order_items.filter((i) => i.order_id === order.id);
  return { order, items };
}

export function getAllLocalOrders(): Order[] {
  return [...db().orders].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getLocalOrderDetail(orderNumber: string) {
  const d = db();
  const order = d.orders.find((o) => o.order_number === orderNumber);
  if (!order) return null;
  return {
    order,
    items: d.order_items.filter((i) => i.order_id === order.id),
    history: d.order_status_history
      .filter((h) => h.order_id === order.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}

export function updateLocalOrderStatus(
  orderId: string,
  status: OrderStatus,
  changedBy?: string | null,
) {
  mutate((d) => {
    const order = d.orders.find((o) => o.id === orderId);
    if (!order) return;
    const from = order.status;
    order.status = status;
    order.updated_at = new Date().toISOString();
    d.order_status_history.push({
      id: uid("osh"),
      order_id: orderId,
      from_status: from,
      to_status: status,
      note: null,
      changed_by: changedBy ?? null,
      created_at: new Date().toISOString(),
    });
  });
}
