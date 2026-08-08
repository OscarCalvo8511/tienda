import type { OrderStatus } from "@/types/database.types";
import { formatCOP } from "@/lib/utils";
import { env } from "@/lib/env";

export interface OrderEmailItem {
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl: string | null;
}

export interface OrderEmailData {
  storeName: string;
  orderNumber: string;
  createdAt: string; // ISO
  customerName: string | null;
  items: OrderEmailItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  taxIncluded: boolean;
  total: number;
  shippingAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    department: string;
  } | null;
  orderUrl: string;
}

const BRAND = "#171717";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

/** Fecha y hora en formato colombiano (America/Bogota). */
function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemsTable(items: OrderEmailItem[]): string {
  const rows = items
    .map((it) => {
      const img = it.imageUrl
        ? `<img src="${esc(it.imageUrl)}" width="56" height="56" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid ${BORDER};display:block" />`
        : `<div style="width:56px;height:56px;border-radius:8px;border:1px solid ${BORDER};background:#f3f4f6"></div>`;
      return `
      <tr>
        <td style="padding:10px 0;width:56px;vertical-align:top">${img}</td>
        <td style="padding:10px 12px;vertical-align:top">
          <div style="font-size:14px;color:#111827;font-weight:600">${esc(it.name)}</div>
          <div style="font-size:13px;color:${MUTED};margin-top:2px">Cantidad: ${it.quantity} × ${formatCOP(it.unitPrice)}</div>
        </td>
        <td style="padding:10px 0;vertical-align:top;text-align:right;font-size:14px;color:#111827;white-space:nowrap">${formatCOP(it.unitPrice * it.quantity)}</td>
      </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows}</table>`;
}

function totalsBlock(d: OrderEmailData): string {
  const row = (label: string, value: string, opts?: { bold?: boolean; muted?: boolean }) => `
    <tr>
      <td style="padding:4px 0;font-size:${opts?.bold ? "16px" : "14px"};color:${opts?.muted ? MUTED : "#111827"};font-weight:${opts?.bold ? "700" : "400"}">${label}</td>
      <td style="padding:4px 0;text-align:right;font-size:${opts?.bold ? "16px" : "14px"};color:${opts?.muted ? MUTED : "#111827"};font-weight:${opts?.bold ? "700" : "400"}">${value}</td>
    </tr>`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px">
      ${row("Subtotal", formatCOP(d.subtotal))}
      ${d.discount > 0 ? row("Descuento", `−${formatCOP(d.discount)}`) : ""}
      ${row("Envío", d.shipping > 0 ? formatCOP(d.shipping) : "Gratis")}
      ${row(d.taxIncluded ? "IVA incluido" : "IVA", formatCOP(d.tax), { muted: true })}
      ${row("Total", formatCOP(d.total), { bold: true })}
    </table>`;
}

function addressBlock(d: OrderEmailData): string {
  if (!d.shippingAddress) return "";
  const a = d.shippingAddress;
  const parts = [a.line1, a.line2, `${a.city}, ${a.department}`]
    .filter(Boolean)
    .map((p) => esc(String(p)))
    .join("<br/>");
  return `
    <div style="margin-top:24px">
      <div style="font-size:13px;color:${MUTED};text-transform:uppercase;letter-spacing:.03em;font-weight:600;margin-bottom:6px">Dirección de envío</div>
      <div style="font-size:14px;color:#111827;line-height:1.5">${parts}</div>
    </div>`;
}

function layout(opts: {
  storeName: string;
  heading: string;
  intro: string;
  accent?: string;
  body: string;
  orderNumber: string;
  orderUrl: string;
  ctaLabel?: string;
  footerNote?: string;
}): string {
  const accent = opts.accent ?? BRAND;
  const ctaLabel = opts.ctaLabel ?? "Ver mi pedido";
  const footerNote =
    opts.footerNote ??
    `Recibiste este correo porque realizaste un pedido en ${esc(opts.storeName)}. Si tienes dudas, responde a este mensaje.`;
  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${BORDER}">
        <tr><td style="background:${BRAND};padding:20px 28px;text-align:center">
          <img src="${env.siteUrl}/logo.jpg" width="72" height="72" alt="${esc(opts.storeName)}" style="width:72px;height:72px;border-radius:50%;display:inline-block;vertical-align:middle" />
        </td></tr>
        <tr><td style="padding:28px">
          <div style="display:inline-block;background:${accent}1a;color:${accent};font-size:12px;font-weight:700;padding:5px 10px;border-radius:999px">Pedido ${esc(opts.orderNumber)}</div>
          <h1 style="font-size:22px;color:#111827;margin:16px 0 8px">${esc(opts.heading)}</h1>
          <p style="font-size:14px;color:${MUTED};margin:0 0 20px;line-height:1.55">${opts.intro}</p>
          ${opts.body}
          <div style="margin-top:28px">
            <a href="${esc(opts.orderUrl)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:9px">${esc(ctaLabel)}</a>
          </div>
        </td></tr>
        <tr><td style="padding:20px 28px;border-top:1px solid ${BORDER}">
          <p style="font-size:12px;color:${MUTED};margin:0;line-height:1.5">${footerNote}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Correo de "pedido creado". */
export function orderCreatedEmail(d: OrderEmailData): {
  subject: string;
  html: string;
} {
  const hello = d.customerName ? `Hola ${esc(d.customerName)}, ` : "";
  const body = `
    <div style="font-size:13px;color:${MUTED};margin-bottom:16px">Fecha: ${formatDateTime(d.createdAt)}</div>
    ${itemsTable(d.items)}
    <div style="border-top:1px solid ${BORDER};margin-top:12px;padding-top:8px">${totalsBlock(d)}</div>
    ${addressBlock(d)}`;
  return {
    subject: `Recibimos tu pedido ${d.orderNumber} · ${d.storeName}`,
    html: layout({
      storeName: d.storeName,
      heading: "¡Recibimos tu pedido!",
      intro: `${hello}gracias por tu compra. Estos son los detalles de tu pedido realizado el ${formatDateTime(d.createdAt)}.`,
      body,
      orderNumber: d.orderNumber,
      orderUrl: d.orderUrl,
    }),
  };
}

/** Bloque con los datos de contacto del cliente (solo para el correo del admin). */
function customerBlock(opts: {
  name: string | null;
  email: string;
  phone: string | null;
}): string {
  const line = (label: string, value: string) => `
    <tr>
      <td style="padding:2px 0;font-size:13px;color:${MUTED};width:90px">${label}</td>
      <td style="padding:2px 0;font-size:14px;color:#111827">${esc(value)}</td>
    </tr>`;
  return `
    <div style="margin-bottom:20px;padding:14px 16px;background:#f9fafb;border:1px solid ${BORDER};border-radius:10px">
      <div style="font-size:13px;color:${MUTED};text-transform:uppercase;letter-spacing:.03em;font-weight:600;margin-bottom:8px">Cliente</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        ${opts.name ? line("Nombre", opts.name) : ""}
        ${line("Correo", opts.email)}
        ${opts.phone ? line("Teléfono", opts.phone) : ""}
      </table>
    </div>`;
}

/** Correo interno para el admin de la tienda: se concretó una nueva compra. */
export function adminNewOrderEmail(
  d: OrderEmailData,
  extra: { customerEmail: string; customerPhone: string | null; adminUrl: string },
): { subject: string; html: string } {
  const body = `
    <div style="font-size:13px;color:${MUTED};margin-bottom:16px">Fecha: ${formatDateTime(d.createdAt)}</div>
    ${customerBlock({ name: d.customerName, email: extra.customerEmail, phone: extra.customerPhone })}
    ${itemsTable(d.items)}
    <div style="border-top:1px solid ${BORDER};margin-top:12px;padding-top:8px">${totalsBlock(d)}</div>
    ${addressBlock(d)}`;
  return {
    subject: `🛒 Nueva compra ${d.orderNumber} · ${formatCOP(d.total)}`,
    html: layout({
      storeName: d.storeName,
      heading: "Nueva compra recibida",
      intro: `Se concretó una compra por <strong>${formatCOP(d.total)}</strong>. Revisa los detalles abajo o entra al panel para gestionarla.`,
      accent: "#16a34a",
      body,
      orderNumber: d.orderNumber,
      orderUrl: extra.adminUrl,
      ctaLabel: "Ver pedido en el panel",
      footerNote: `Notificación automática de nueva compra en ${esc(d.storeName)}.`,
    }),
  };
}

const STATUS_COPY: Record<
  OrderStatus,
  { heading: string; intro: string; accent: string }
> = {
  pending: {
    heading: "Tu pedido está pendiente de pago",
    intro: "Estamos a la espera de la confirmación de tu pago.",
    accent: "#d97706",
  },
  paid: {
    heading: "¡Pago confirmado!",
    intro: "Recibimos tu pago y tu pedido quedó confirmado. Pronto empezaremos a prepararlo.",
    accent: "#16a34a",
  },
  preparing: {
    heading: "Estamos preparando tu pedido",
    intro: "Tu pedido está siendo alistado con cuidado. Te avisaremos cuando salga.",
    accent: "#2563eb",
  },
  shipped: {
    heading: "Tu pedido va en camino",
    intro: "¡Buenas noticias! Tu pedido fue despachado y está en ruta hacia tu dirección.",
    accent: "#2563eb",
  },
  delivered: {
    heading: "Tu pedido fue entregado",
    intro: "Tu pedido fue marcado como entregado. ¡Esperamos que lo disfrutes!",
    accent: "#16a34a",
  },
  cancelled: {
    heading: "Tu pedido fue cancelado",
    intro: "Tu pedido fue cancelado. Si crees que es un error o tienes dudas, responde a este correo.",
    accent: "#dc2626",
  },
  returned: {
    heading: "Tu pedido fue devuelto",
    intro: "Registramos la devolución de tu pedido. Si tienes dudas sobre el reembolso, escríbenos.",
    accent: "#dc2626",
  },
};

/** Correo de cambio de estado del pedido. */
export function orderStatusEmail(
  d: OrderEmailData,
  status: OrderStatus,
): { subject: string; html: string } {
  const copy = STATUS_COPY[status] ?? STATUS_COPY.preparing;
  const hello = d.customerName ? `Hola ${esc(d.customerName)}, ` : "";
  const body = `
    ${itemsTable(d.items)}
    <div style="border-top:1px solid ${BORDER};margin-top:12px;padding-top:8px">${totalsBlock(d)}</div>
    ${addressBlock(d)}`;
  return {
    subject: `${copy.heading} · Pedido ${d.orderNumber}`,
    html: layout({
      storeName: d.storeName,
      heading: copy.heading,
      intro: `${hello}${copy.intro}`,
      accent: copy.accent,
      body,
      orderNumber: d.orderNumber,
      orderUrl: d.orderUrl,
    }),
  };
}
