import { listAdminCategories } from "@/features/admin/categories";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const rows = await listAdminCategories();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categorías</h1>
        <p className="text-sm text-muted-foreground">
          Organiza tu catálogo con categorías padre e hijas
        </p>
      </div>
      <CategoriesManager rows={rows} />
    </div>
  );
}
