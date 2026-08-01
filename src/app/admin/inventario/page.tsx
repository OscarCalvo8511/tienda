import { listInventory, listMovements } from "@/features/admin/inventory";
import { InventoryManager } from "@/components/admin/inventory-manager";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  in: "Entrada",
  out: "Salida",
  adjustment: "Ajuste",
  sale: "Venta",
  return: "Devolución",
};

export default async function AdminInventoryPage() {
  const rows = await listInventory();
  const movements = await listMovements(30);
  const low = rows.filter((r) => r.status !== "ok").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventario</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} productos · {low} con alerta de stock
        </p>
      </div>

      <InventoryManager rows={rows} />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Historial de movimientos</h2>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Fecha</th>
                <th className="p-3 font-medium">Producto</th>
                <th className="p-3 font-medium">Tipo</th>
                <th className="p-3 font-medium">Cambio</th>
                <th className="p-3 font-medium">Resultante</th>
                <th className="p-3 font-medium">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="p-3 text-muted-foreground">
                    {formatDate(m.created_at, { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="p-3">{m.product_name}</td>
                  <td className="p-3">{TYPE_LABELS[m.type] ?? m.type}</td>
                  <td className={`p-3 font-medium ${m.quantity < 0 ? "text-destructive" : "text-success"}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="p-3">{m.new_qty}</td>
                  <td className="p-3 text-muted-foreground">{m.reason ?? "—"}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Sin movimientos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
