"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import type { Address } from "@/types/database.types";
import {
  saveAddressAction,
  deleteAddressAction,
} from "@/features/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { COLOMBIA_DEPARTMENTS } from "@/lib/colombia";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AddressesManager({ addresses }: { addresses: Address[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(a: Address) {
    setEditing(a);
    setOpen(true);
  }

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      full_name: String(fd.get("full_name")),
      phone: String(fd.get("phone")),
      line1: String(fd.get("line1")),
      line2: String(fd.get("line2") ?? "") || null,
      city: String(fd.get("city")),
      department: String(fd.get("department")),
      country: "Colombia",
      is_default: fd.get("is_default") === "on",
    };
    startTransition(async () => {
      await saveAddressAction(input, editing?.id);
      toast.success(editing ? "Dirección actualizada" : "Dirección agregada");
      setOpen(false);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteAddressAction(id);
      toast.success("Dirección eliminada");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="size-4" /> Nueva dirección
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          No tienes direcciones guardadas.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className={`rounded-xl border bg-card p-4 ${pending ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="flex items-center gap-2 font-medium">
                    {a.full_name}
                    {a.is_default && (
                      <Badge variant="secondary" className="bg-brand/10 text-brand">
                        <Star className="size-3" /> Predeterminada
                      </Badge>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{a.phone}</p>
                  <p className="text-sm text-muted-foreground">
                    {a.line1}{a.line2 ? `, ${a.line2}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {a.city}, {a.department}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar dirección" : "Nueva dirección"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre completo" name="full_name" defaultValue={editing?.full_name} required />
              <Field label="Teléfono" name="phone" defaultValue={editing?.phone} required />
            </div>
            <Field label="Dirección" name="line1" defaultValue={editing?.line1} required />
            <Field label="Complemento" name="line2" defaultValue={editing?.line2 ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ciudad" name="city" defaultValue={editing?.city} required />
              <div className="space-y-1.5">
                <Label htmlFor="department">Departamento</Label>
                <select
                  id="department"
                  name="department"
                  defaultValue={editing?.department ?? ""}
                  required
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="" disabled>Selecciona…</option>
                  {COLOMBIA_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_default" defaultChecked={editing?.is_default ?? false} />
              Usar como predeterminada
            </label>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
