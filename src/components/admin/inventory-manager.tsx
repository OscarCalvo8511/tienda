"use client";

import { useState, useTransition } from "react";
import { Plus, Minus, Settings2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { InventoryRow } from "@/features/admin/inventory";
import { adjustInventoryAction } from "@/features/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function InventoryManager({ rows }: { rows: InventoryRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="p-3 font-medium">Producto</th>
            <th className="p-3 font-medium">SKU</th>
            <th className="p-3 font-medium">Stock</th>
            <th className="p-3 font-medium">Estado</th>
            <th className="p-3 text-right font-medium">Ajustar</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.productId}>
              <td className="p-3 font-medium">{r.name}</td>
              <td className="p-3 text-muted-foreground">{r.sku ?? "—"}</td>
              <td className="p-3 font-semibold">{r.quantity}</td>
              <td className="p-3">
                {r.status === "out" ? (
                  <Badge variant="outline" className="text-destructive">Agotado</Badge>
                ) : r.status === "low" ? (
                  <Badge variant="secondary" className="bg-warning/15 text-warning">Bajo</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-success/10 text-success">OK</Badge>
                )}
              </td>
              <td className="p-3 text-right">
                <AdjustDialog row={r} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdjustDialog({ row }: { row: InventoryRow }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [mode, setMode] = useState<"in" | "out" | "adjustment">("in");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const delta =
      mode === "in" ? qty : mode === "out" ? -qty : qty - row.quantity;
    startTransition(async () => {
      await adjustInventoryAction({
        productId: row.productId,
        delta,
        type: mode === "adjustment" ? "adjustment" : mode,
        reason: reason || null,
      });
      toast.success("Inventario actualizado");
      setOpen(false);
      setReason("");
      setQty(1);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="size-4" /> Ajustar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar inventario · {row.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === "in" ? "default" : "outline"} size="sm" onClick={() => setMode("in")}>
              <Plus className="size-4" /> Entrada
            </Button>
            <Button variant={mode === "out" ? "default" : "outline"} size="sm" onClick={() => setMode("out")}>
              <Minus className="size-4" /> Salida
            </Button>
            <Button variant={mode === "adjustment" ? "default" : "outline"} size="sm" onClick={() => setMode("adjustment")}>
              Fijar total
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qty">
              {mode === "adjustment" ? "Nueva cantidad total" : "Cantidad"}
            </Label>
            <Input
              id="qty"
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(Math.max(0, Number(e.target.value)))}
            />
            <p className="text-xs text-muted-foreground">Stock actual: {row.quantity}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Compra, merma, corrección…" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
