import { listCoupons } from "@/features/admin/coupons";
import { CouponsManager } from "@/components/admin/coupons-manager";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await listCoupons();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cupones</h1>
        <p className="text-sm text-muted-foreground">
          Descuentos por porcentaje, monto fijo o envío gratis
        </p>
      </div>
      <CouponsManager coupons={coupons} />
    </div>
  );
}
