import Link from "next/link";
import { Plus } from "lucide-react";
import { listAdminProducts } from "@/features/admin/products";
import { ProductsTable } from "@/components/admin/products-table";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const rows = await listAdminProducts();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground">{rows.length} en total</p>
        </div>
        <Button asChild>
          <Link href="/admin/productos/nuevo">
            <Plus className="size-4" /> Nuevo producto
          </Link>
        </Button>
      </div>
      <ProductsTable rows={rows} />
    </div>
  );
}
