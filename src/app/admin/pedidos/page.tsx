import Link from "next/link";
import { getAllOrders } from "@/features/orders/api";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { formatCOP, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">{orders.length} pedidos</p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Pedido</th>
              <th className="p-3 font-medium">Cliente</th>
              <th className="p-3 font-medium">Fecha</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Estado</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="p-3 font-medium">{o.order_number}</td>
                <td className="p-3 text-muted-foreground">{o.customer_email ?? "—"}</td>
                <td className="p-3 text-muted-foreground">
                  {formatDate(o.created_at, { dateStyle: "short" })}
                </td>
                <td className="p-3 font-medium">{formatCOP(o.total)}</td>
                <td className="p-3">
                  <OrderStatusSelect orderId={o.id} status={o.status} />
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/admin/pedidos/${o.order_number}`}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-muted-foreground">
                  Aún no hay pedidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
