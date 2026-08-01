import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { getCurrentUser } from "@/features/auth/api";
import { getUserOrders } from "@/features/orders/api";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { ReorderButton } from "@/components/shop/reorder-button";
import { Button } from "@/components/ui/button";
import { formatCOP, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Mis pedidos" };
export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const user = await getCurrentUser();
  const orders = user ? await getUserOrders(user.id) : [];

  if (!orders.length) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center">
        <Package className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          Aún no tienes pedidos.
        </p>
        <Button asChild className="mt-4">
          <Link href="/productos">Explorar productos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{o.order_number}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(o.created_at, { dateStyle: "long" })}
              </p>
            </div>
            <OrderStatusBadge status={o.status} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            <span className="text-lg font-bold">{formatCOP(o.total)}</span>
            <div className="flex gap-2">
              <ReorderButton orderNumber={o.order_number} />
              <Button asChild size="sm">
                <Link href={`/cuenta/pedidos/${o.order_number}`}>Ver detalle</Link>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
