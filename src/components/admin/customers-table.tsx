"use client";

import { useTransition } from "react";
import { Ban, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CustomerRow } from "@/features/admin/customers";
import {
  toggleCustomerBlockedAction,
  deleteCustomerAction,
} from "@/features/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCOP, formatDate } from "@/lib/utils";

export function CustomersTable({ rows }: { rows: CustomerRow[] }) {
  const [pending, startTransition] = useTransition();

  function toggle(id: string, blocked: boolean) {
    startTransition(async () => {
      await toggleCustomerBlockedAction(id);
      toast.success(blocked ? "Cliente desbloqueado" : "Cliente bloqueado");
    });
  }
  function remove(id: string) {
    startTransition(async () => {
      await deleteCustomerAction(id);
      toast.success("Cliente eliminado");
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="p-3 font-medium">Cliente</th>
            <th className="p-3 font-medium">Rol</th>
            <th className="p-3 font-medium">Pedidos</th>
            <th className="p-3 font-medium">Total gastado</th>
            <th className="p-3 font-medium">Registro</th>
            <th className="p-3 font-medium">Estado</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((c) => (
            <tr key={c.id} className={pending ? "opacity-60" : ""}>
              <td className="p-3">
                <p className="font-medium">{c.full_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{c.email}</p>
              </td>
              <td className="p-3">
                <Badge variant={c.role === "admin" ? "default" : "outline"}>
                  {c.role === "admin" ? "Admin" : "Cliente"}
                </Badge>
              </td>
              <td className="p-3">{c.orders_count}</td>
              <td className="p-3 font-medium">{formatCOP(c.total_spent)}</td>
              <td className="p-3 text-muted-foreground">
                {formatDate(c.created_at, { dateStyle: "short" })}
              </td>
              <td className="p-3">
                {c.is_blocked ? (
                  <Badge variant="outline" className="text-destructive">Bloqueado</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-success/10 text-success">Activo</Badge>
                )}
              </td>
              <td className="p-3">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => toggle(c.id, c.is_blocked)} title={c.is_blocked ? "Desbloquear" : "Bloquear"}>
                    {c.is_blocked ? <CheckCircle2 className="size-4 text-success" /> : <Ban className="size-4 text-warning" />}
                  </Button>
                  {c.role !== "admin" && (
                    <Button variant="ghost" size="icon" onClick={() => remove(c.id)} title="Eliminar">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
