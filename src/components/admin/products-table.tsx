"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { MoreHorizontal, Copy, Power, Trash2, Pencil, ImageOff } from "lucide-react";
import { toast } from "sonner";
import type { AdminProductRow } from "@/features/admin/products";
import {
  duplicateProductAction,
  toggleProductActiveAction,
  deleteProductAction,
} from "@/features/admin/actions";
import { formatCOP } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ProductsTable({ rows }: { rows: AdminProductRow[] }) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<AdminProductRow | null>(null);

  function run(fn: () => Promise<unknown>, msg: string) {
    startTransition(async () => {
      await fn();
      toast.success(msg);
    });
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Producto</th>
              <th className="p-3 font-medium">Categoría</th>
              <th className="p-3 font-medium">Precio</th>
              <th className="p-3 font-medium">Stock</th>
              <th className="p-3 font-medium">Estado</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((p) => (
              <tr key={p.id} className={pending ? "opacity-60" : ""}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center text-muted-foreground">
                          <ImageOff className="size-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.sku ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{p.category_name ?? "—"}</td>
                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {formatCOP(p.sale_price ?? p.price)}
                    </span>
                    {p.sale_price && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatCOP(p.price)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <span className={p.stock <= 0 ? "text-destructive" : p.stock <= 5 ? "text-warning" : ""}>
                    {p.stock}
                  </span>
                </td>
                <td className="p-3">
                  {p.is_active ? (
                    <Badge variant="secondary" className="bg-success/10 text-success">Activo</Badge>
                  ) : (
                    <Badge variant="outline">Inactivo</Badge>
                  )}
                </td>
                <td className="p-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="grid size-8 place-items-center rounded-md hover:bg-accent">
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/productos/${p.id}`}>
                          <Pencil className="size-4" /> Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          run(() => duplicateProductAction(p.id), "Producto duplicado")
                        }
                      >
                        <Copy className="size-4" /> Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          run(
                            () => toggleProductActiveAction(p.id),
                            p.is_active ? "Producto desactivado" : "Producto activado",
                          )
                        }
                      >
                        <Power className="size-4" /> {p.is_active ? "Desactivar" : "Activar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setToDelete(p)}
                      >
                        <Trash2 className="size-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-muted-foreground">
                  No hay productos. Crea el primero.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará “{toDelete?.name}” de forma permanente. Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const p = toDelete;
                setToDelete(null);
                if (p) run(() => deleteProductAction(p.id), "Producto eliminado");
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
