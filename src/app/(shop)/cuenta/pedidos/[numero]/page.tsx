import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCurrentProfile } from "@/features/auth/api";
import { getOrderDetail } from "@/features/orders/api";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { PrintButton } from "@/components/shop/print-button";
import { formatCOP, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyOrderDetailPage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const detail = await getOrderDetail(numero);
  if (!detail) notFound();
  const { order, items } = detail;

  // Verificación de propiedad
  if (order.user_id !== profile.id && profile.role !== "admin") notFound();

  const addr = (order.shipping_address ?? {}) as Record<string, string>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/cuenta/pedidos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Mis pedidos
        </Link>
        <PrintButton />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{order.order_number}</h2>
          <p className="text-sm text-muted-foreground">
            {formatDate(order.created_at, { dateStyle: "long" })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="rounded-xl border bg-card">
        <div className="divide-y">
          {items.map((it) => (
            <div key={it.id} className="flex justify-between gap-2 p-4 text-sm">
              <span>{it.quantity}× {it.product_name}</span>
              <span className="font-medium">{formatCOP(it.line_total)}</span>
            </div>
          ))}
        </div>
        <dl className="space-y-1 border-t p-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatCOP(order.subtotal)}</dd></div>
          {order.discount_total > 0 && (
            <div className="flex justify-between text-success"><dt>Descuento</dt><dd>−{formatCOP(order.discount_total)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-muted-foreground">Envío</dt><dd>{order.shipping_total === 0 ? "Gratis" : formatCOP(order.shipping_total)}</dd></div>
          <div className="flex justify-between border-t pt-1 text-base font-bold"><dt>Total</dt><dd>{formatCOP(order.total)}</dd></div>
        </dl>
      </div>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h3 className="mb-2 font-semibold">Dirección de envío</h3>
        <p>{addr.full_name}</p>
        <p className="text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
        <p className="text-muted-foreground">{addr.city}, {addr.department}, {addr.country}</p>
      </section>
    </div>
  );
}
