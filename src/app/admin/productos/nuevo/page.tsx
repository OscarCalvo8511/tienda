import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAllCategories } from "@/features/categories/api";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getAllCategories();
  return (
    <div className="space-y-6">
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Volver
      </Link>
      <h1 className="text-2xl font-bold">Nuevo producto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
