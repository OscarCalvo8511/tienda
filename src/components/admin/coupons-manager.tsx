"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Coupon } from "@/types/database.types";
import { saveCouponAction, deleteCouponAction } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCOP, formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      code: String(fd.get("code")),
      description: String(fd.get("description") ?? "") || null,
      type: String(fd.get("type")) as Coupon["type"],
      value: Number(fd.get("value") ?? 0),
      min_purchase: Number(fd.get("min_purchase") ?? 0),
      max_uses: fd.get("max_uses") ? Number(fd.get("max_uses")) : null,
      expires_at: String(fd.get("expires_at") ?? "") || null,
      is_active: true,
    };
    if (!input.code) return toast.error("El código es obligatorio");
    startTransition(async () => {
      await saveCouponAction(input);
      toast.success("Cupón creado");
      setOpen(false);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteCouponAction(id);
      toast.success("Cupón eliminado");
    });
  }

  const typeLabel = (c: Coupon) =>
    c.type === "percentage"
      ? `${c.value}%`
      : c.type === "fixed"
        ? formatCOP(c.value)
        : "Envío gratis";

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Nuevo cupón
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Código</th>
              <th className="p-3 font-medium">Beneficio</th>
              <th className="p-3 font-medium">Mínimo</th>
              <th className="p-3 font-medium">Usos</th>
              <th className="p-3 font-medium">Expira</th>
              <th className="p-3 font-medium">Estado</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {coupons.map((c) => (
              <tr key={c.id} className={pending ? "opacity-60" : ""}>
                <td className="p-3 font-mono font-medium">{c.code}</td>
                <td className="p-3">{typeLabel(c)}</td>
                <td className="p-3 text-muted-foreground">{formatCOP(c.min_purchase)}</td>
                <td className="p-3">{c.uses_count}{c.max_uses ? `/${c.max_uses}` : ""}</td>
                <td className="p-3 text-muted-foreground">
                  {c.expires_at ? formatDate(c.expires_at, { dateStyle: "short" }) : "—"}
                </td>
                <td className="p-3">
                  {c.is_active ? (
                    <Badge variant="secondary" className="bg-success/10 text-success">Activo</Badge>
                  ) : (
                    <Badge variant="outline">Inactivo</Badge>
                  )}
                </td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No hay cupones.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo cupón</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="code">Código</Label>
                <Input id="code" name="code" placeholder="DESCUENTO20" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Tipo</Label>
                <select id="type" name="type" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto fijo (COP)</option>
                  <option value="free_shipping">Envío gratis</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="value">Valor</Label>
                <Input id="value" name="value" type="number" defaultValue={10} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="min_purchase">Compra mínima</Label>
                <Input id="min_purchase" name="min_purchase" type="number" defaultValue={0} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max_uses">Usos máximos</Label>
                <Input id="max_uses" name="max_uses" type="number" placeholder="Ilimitado" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expires_at">Expira</Label>
                <Input id="expires_at" name="expires_at" type="date" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Crear cupón
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
