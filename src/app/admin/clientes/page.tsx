import { listCustomers } from "@/features/admin/customers";
import { CustomersTable } from "@/components/admin/customers-table";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const rows = await listCustomers();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-muted-foreground">{rows.length} usuarios registrados</p>
      </div>
      <CustomersTable rows={rows} />
    </div>
  );
}
