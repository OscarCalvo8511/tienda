import type { Metadata } from "next";
import { getProducts, type ProductFilters } from "@/features/products/api";
import { getCategoryTree } from "@/features/categories/api";
import { ProductGrid } from "@/components/shop/product-grid";
import {
  CatalogFilters,
  SortSelect,
} from "@/components/shop/catalog-filters";
import { PaginationNav } from "@/components/shop/pagination-nav";

export const metadata: Metadata = { title: "Catálogo de productos" };

type SP = {
  categoria?: string;
  orden?: string;
  oferta?: string;
  min?: string;
  max?: string;
  q?: string;
  page?: string;
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const filters: ProductFilters = {
    categorySlug: sp.categoria,
    onSale: sp.oferta === "1",
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    search: sp.q,
    sort: (sp.orden as ProductFilters["sort"]) ?? "newest",
    page: sp.page ? Number(sp.page) : 1,
  };

  const [{ products, total, page, totalPages }, tree] = await Promise.all([
    getProducts(filters).catch(() => ({
      products: [],
      total: 0,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    })),
    getCategoryTree().catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">
        {sp.categoria
          ? tree
              .flatMap((c) => [c, ...c.children])
              .find((c) => c.slug === sp.categoria)?.name ?? "Productos"
          : "Todos los productos"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {total} {total === 1 ? "producto" : "productos"}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_1fr]">
        <div className="hidden lg:block">
          <CatalogFilters tree={tree} />
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="lg:hidden">
              {/* Filtros compactos en móvil: solo orden */}
            </div>
            <span className="hidden text-sm text-muted-foreground lg:block">
              Mostrando {products.length} de {total}
            </span>
            <SortSelect />
          </div>

          <ProductGrid
            products={products}
            className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            empty="No encontramos productos con esos filtros."
          />

          <PaginationNav page={page} totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}
