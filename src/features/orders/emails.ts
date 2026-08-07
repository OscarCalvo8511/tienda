import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { env, ORDER_ADMIN_EMAIL } from "@/lib/env";
import { sendEmail } from "@/lib/email/client";
import {
  orderCreatedEmail,
  orderStatusEmail,
  adminNewOrderEmail,
  type OrderEmailData,
  type OrderEmailItem,
} from "@/lib/email/order-templates";
import { getSettings } from "@/features/settings/api";
import type { OrderStatus } from "@/types/database.types";

interface OrderRow {
  id: string;
  order_number: string;
  created_at: string;
  customer_email: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  shipping_address: Record<string, unknown> | null;
}

interface ItemRow {
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
}

/**
 * Reúne los datos del pedido (cabecera, líneas e imágenes principales) para
 * armar un correo. Usa el cliente admin: funciona tanto desde el panel como
 * desde el webhook/retorno de pago, donde no hay sesión de usuario.
 */
async function buildOrderEmailData(
  orderId: string,
): Promise<{
  emailData: OrderEmailData;
  to: string;
  customerPhone: string | null;
} | null> {
  const admin = createAdminClient();

  const { data: orderData } = await admin
    .from("orders")
    .select(
      "id, order_number, created_at, customer_email, subtotal, discount_total, shipping_total, tax_total, total, shipping_address",
    )
    .eq("id", orderId)
    .maybeSingle();
  const order = orderData as OrderRow | null;
  if (!order) return null;

  const { data: itemData } = await admin
    .from("order_items")
    .select("product_id, product_name, unit_price, quantity")
    .eq("order_id", orderId);
  const itemRows = (itemData ?? []) as ItemRow[];

  // Imagen principal por producto.
  const productIds = itemRows
    .map((i) => i.product_id)
    .filter((id): id is string => Boolean(id));
  const imageByProduct = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: imgData } = await admin
      .from("product_images")
      .select("product_id, url, is_primary, position")
      .in("product_id", productIds);
    const imgs = (imgData ?? []) as {
      product_id: string;
      url: string;
      is_primary: boolean;
      position: number;
    }[];
    for (const id of productIds) {
      const forProduct = imgs
        .filter((im) => im.product_id === id)
        .sort(
          (a, b) =>
            Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
        );
      if (forProduct[0]) imageByProduct.set(id, forProduct[0].url);
    }
  }

  const items: OrderEmailItem[] = itemRows.map((i) => ({
    name: i.product_name,
    quantity: i.quantity,
    unitPrice: Number(i.unit_price),
    imageUrl: i.product_id ? imageByProduct.get(i.product_id) ?? null : null,
  }));

  const settings = await getSettings();
  const addr = order.shipping_address ?? {};
  const customerName =
    typeof addr.full_name === "string" ? addr.full_name : null;

  return {
    to: order.customer_email,
    customerPhone: typeof addr.phone === "string" ? addr.phone : null,
    emailData: {
      storeName: settings.store.name,
      orderNumber: order.order_number,
      createdAt: order.created_at,
      customerName,
      items,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount_total),
      shipping: Number(order.shipping_total),
      tax: Number(order.tax_total),
      taxIncluded: settings.tax.included,
      total: Number(order.total),
      shippingAddress: {
        line1: typeof addr.line1 === "string" ? addr.line1 : "",
        line2: typeof addr.line2 === "string" ? addr.line2 : null,
        city: typeof addr.city === "string" ? addr.city : "",
        department: typeof addr.department === "string" ? addr.department : "",
      },
      orderUrl: `${env.siteUrl}/cuenta/pedidos/${encodeURIComponent(order.order_number)}`,
    },
  };
}

/** Envía el correo de "pedido creado". Nunca lanza. */
export async function notifyOrderCreated(orderId: string): Promise<void> {
  try {
    const built = await buildOrderEmailData(orderId);
    if (!built) return;
    const { subject, html } = orderCreatedEmail(built.emailData);
    await sendEmail({ to: built.to, subject, html });
  } catch (err) {
    console.error("[email] notifyOrderCreated falló:", err);
  }
}

/**
 * Avisa al administrador (correo de contacto de la tienda) que se concretó una
 * nueva compra, con los datos del cliente y un enlace al panel. Nunca lanza:
 * un fallo de correo no debe afectar la compra.
 */
export async function notifyAdminNewOrder(orderId: string): Promise<void> {
  try {
    const built = await buildOrderEmailData(orderId);
    if (!built) return;
    const adminTo = ORDER_ADMIN_EMAIL;
    if (!adminTo) return;
    const adminUrl = `${env.siteUrl}/admin/pedidos/${encodeURIComponent(built.emailData.orderNumber)}`;
    const { subject, html } = adminNewOrderEmail(built.emailData, {
      customerEmail: built.to,
      customerPhone: built.customerPhone,
      adminUrl,
    });
    // replyTo al cliente: así el admin puede responderle directo desde el aviso.
    await sendEmail({ to: adminTo, subject, html, replyTo: built.to });
  } catch (err) {
    console.error("[email] notifyAdminNewOrder falló:", err);
  }
}

/** Envía el correo de cambio de estado del pedido. Nunca lanza. */
export async function notifyOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  try {
    const built = await buildOrderEmailData(orderId);
    if (!built) return;
    const { subject, html } = orderStatusEmail(built.emailData, status);
    await sendEmail({ to: built.to, subject, html });
  } catch (err) {
    console.error("[email] notifyOrderStatus falló:", err);
  }
}
