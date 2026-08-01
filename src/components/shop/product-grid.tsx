import { ProductCard } from "./product-card";
import type { ProductWithImage } from "@/features/products/types";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  className,
  empty = "No hay productos para mostrar.",
}: {
  products: ProductWithImage[];
  className?: string;
  empty?: string;
}) {
  if (!products.length) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
