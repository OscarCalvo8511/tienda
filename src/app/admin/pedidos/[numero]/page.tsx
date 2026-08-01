import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getOrderDetail } from "@/features/orders/api";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { formatCOP, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  const detail = await getOrderDetail(numero);
  if (!detail) notFound();
  const { order, items, history } = detail;
  const addr = (order.shipping_address ?? {}) as Record<string, string>;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Volver a pedidos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(order.created_at, { dateStyle: "long", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-xl border bg-card">
            <h2 className="border-b p-4 text-sm font-semibold">Productos</h2>
            <div className="divide-y">
              {items.map((it) => (
                <div key={it.id} className="flex justify-between gap-2 p-4 text-sm">
                  <span>
                    {it.quantity}× {it.product_name}
                    {it.sku && <span className="text-muted-foreground"> ({it.sku})</span>}
                  </span>
                  <span className="font-medium">{formatCOP(it.line_total)}</span>
                </div>
              ))}
            </div>
            <dl className="space-y-1 border-t p-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatCOP(order.subtotal)}</dd></div>
              {order.discount_total > 0 && (
                <div className="flex justify-between text-success"><dt>Descuento</dt><dd>−{formatCOP(order.discount_total)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted-foreground">Envío</dt><dd>{formatCOP(order.shipping_total)}</dd></div>
              <div className="flex justify-between border-t pt-1 text-base font-bold"><dt>Total</dt><dd>{formatCOP(order.total)}</dd></div>
            </dl>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Historial de estados</h2>
            <ol className="space-y-3">
              {history.map((h) => (
                <li key={h.id} className="flex items-center gap-3 text-sm">
                  <span className="size-2 rounded-full bg-brand" />
                  <span className="text-muted-foreground">
                    {formatDate(h.created_at, { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  <span>
                    {h.from_status ? `${h.from_status} → ` : ""}
                    <strong>{h.to_status}</strong>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border bg-card p-4 text-sm">
            <h2 className="mb-2 font-semibold">Cliente</h2>
            <p>{order.customer_email ?? "—"}</p>
            <p className="text-muted-foreground">{order.customer_phone ?? ""}</p>
          </section>
          <section className="rounded-xl border bg-card p-4 text-sm">
            <h2 className="mb-2 font-semibold">Envío</h2>
            <p>{addr.full_name}</p>
            <p className="text-muted-foreground">
              {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}
            </p>
            <p className="text-muted-foreground">
              {addr.city}, {addr.department}, {addr.country}
            </p>
            <p className="mt-2 text-muted-foreground">
              Método: {order.shipping_method ?? "—"}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
