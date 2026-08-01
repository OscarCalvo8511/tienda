"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminCategoryRow } from "@/features/admin/categories";
import {
  saveCategoryAction,
  deleteCategoryAction,
} from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CategoriesManager({ rows }: { rows: AdminCategoryRow[] }) {
  const parents = rows.filter((c) => !c.parent_id);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);
  const [open, setOpen] = useState(false);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(row: AdminCategoryRow) {
    setEditing(row);
    setOpen(true);
  }

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      name: String(fd.get("name")),
      parent_id: String(fd.get("parent_id") ?? "") || null,
      description: String(fd.get("description") ?? "") || null,
      is_active: fd.get("is_active") === "on",
    };
    if (!input.name) return toast.error("El nombre es obligatorio");
    startTransition(async () => {
      await saveCategoryAction(input, editing?.id);
      toast.success(editing ? "Categoría actualizada" : "Categoría creada");
      setOpen(false);
    });
  }

  function remove(row: AdminCategoryRow) {
    startTransition(async () => {
      await deleteCategoryAction(row.id);
      toast.success("Categoría eliminada");
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="size-4" /> Nueva categoría
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Nombre</th>
              <th className="p-3 font-medium">Categoría padre</th>
              <th className="p-3 font-medium">Productos</th>
              <th className="p-3 font-medium">Estado</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((c) => (
              <tr key={c.id} className={pending ? "opacity-60" : ""}>
                <td className="p-3 font-medium">
                  {c.parent_id && <span className="text-muted-foreground">— </span>}
                  {c.name}
                </td>
                <td className="p-3 text-muted-foreground">{c.parent_name ?? "—"}</td>
                <td className="p-3">{c.product_count}</td>
                <td className="p-3">
                  {c.is_active ? (
                    <Badge variant="secondary" className="bg-success/10 text-success">Activa</Badge>
                  ) : (
                    <Badge variant="outline">Inactiva</Badge>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(c)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" defaultValue={editing?.name} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="parent_id">Categoría padre</Label>
              <select
                id="parent_id"
                name="parent_id"
                defaultValue={editing?.parent_id ?? ""}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Ninguna (categoría raíz)</option>
                {parents
                  .filter((p) => p.id !== editing?.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" defaultValue={editing?.description ?? ""} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked={editing?.is_active ?? true} />
              Activa
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
    </>
  );
}
