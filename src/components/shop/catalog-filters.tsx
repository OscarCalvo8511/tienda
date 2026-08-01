"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import type { CategoryTree } from "@/features/categories/api";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORTS = [
  { value: "newest", label: "Más recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "best_selling", label: "Más vendidos" },
  { value: "top_rated", label: "Mejor calificados" },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("orden") ?? "newest";

  function change(value: string) {
    const p = new URLSearchParams(params);
    p.set("orden", value);
    p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  }

  return (
    <Select value={current} onValueChange={change}>
      <SelectTrigger className="w-52">
        <SelectValue placeholder="Ordenar" />
      </SelectTrigger>
      <SelectContent>
        {SORTS.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CatalogFilters({ tree }: { tree: CategoryTree[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeCat = params.get("categoria");
  const onSale = params.get("oferta") === "1";

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const p = new URLSearchParams(params);
      if (value === null) p.delete(key);
      else p.set(key, value);
      p.delete("page");
      router.push(`${pathname}?${p.toString()}`);
    },
    [params, pathname, router],
  );

  return (
    <aside className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Categorías</h3>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              onClick={() => setParam("categoria", null)}
              className={!activeCat ? "font-semibold text-brand" : "text-muted-foreground hover:text-foreground"}
            >
              Todas
            </button>
          </li>
          {tree.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => setParam("categoria", cat.slug)}
                className={activeCat === cat.slug ? "font-semibold text-brand" : "hover:text-brand"}
              >
                {cat.name}
              </button>
              {cat.children.length > 0 && (
                <ul className="ml-3 mt-1 space-y-1 border-l pl-3">
                  {cat.children.map((child) => (
                    <li key={child.id}>
                      <button
                        onClick={() => setParam("categoria", child.slug)}
                        className={
                          activeCat === child.slug
                            ? "font-semibold text-brand"
                            : "text-muted-foreground hover:text-foreground"
                        }
                      >
                        {child.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Ofertas</h3>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={onSale}
            onCheckedChange={(v) => setParam("oferta", v ? "1" : null)}
          />
          Solo productos en oferta
        </label>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Precio</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="min" className="sr-only">Mínimo</Label>
            <input
              id="min"
              type="number"
              placeholder="Mín"
              defaultValue={params.get("min") ?? ""}
              onBlur={(e) => setParam("min", e.target.value || null)}
              className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            />
          </div>
          <span className="text-muted-foreground">–</span>
          <div className="flex-1">
            <Label htmlFor="max" className="sr-only">Máximo</Label>
            <input
              id="max"
              type="number"
              placeholder="Máx"
              defaultValue={params.get("max") ?? ""}
              onBlur={(e) => setParam("max", e.target.value || null)}
              className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
