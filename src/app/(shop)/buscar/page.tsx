import type { Metadata } from "next";
import { getProducts } from "@/features/products/api";
import { ProductGrid } from "@/components/shop/product-grid";
import { SortSelect } from "@/components/shop/catalog-filters";
import { PaginationNav } from "@/components/shop/pagination-nav";

export const metadata: Metadata = { title: "Buscar" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; orden?: string; page?: string }>;
}) {
  const { q = "", orden, page } = await searchParams;

  const { products, total, totalPages } = await getProducts({
    search: q,
    sort: (orden as never) ?? "newest",
    page: page ? Number(page) : 1,
  }).catch(() => ({ products: [], total: 0, totalPages: 1, page: 1, pageSize: 12 }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">
        Resultados para “{q}”
      </h1>
      <div className="mb-4 mt-1 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} encontrados</p>
        <SortSelect />
      </div>
      <ProductGrid
        products={products}
        empty={`No encontramos productos para “${q}”. Prueba con otras palabras.`}
      />
      <PaginationNav page={page ? Number(page) : 1} totalPages={totalPages} />
    </div>
  );
}
