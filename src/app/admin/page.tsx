import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Boxes,
  Ban,
} from "lucide-react";
import { getDashboardMetrics } from "@/features/admin/metrics";
import {
  SalesAreaChart,
  TopProductsChart,
  OrdersStatusChart,
} from "@/components/admin/dashboard-charts";
import { AnalyticsLive } from "@/components/admin/analytics-live";
import { formatCOP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const m = await getDashboardMetrics();

  const kpis = [
    { label: "Ventas del día", value: formatCOP(m.salesToday), icon: DollarSign, tone: "text-brand" },
    { label: "Ventas del mes", value: formatCOP(m.salesMonth), icon: TrendingUp, tone: "text-success" },
    { label: "Ingresos totales", value: formatCOP(m.totalRevenue), icon: DollarSign, tone: "text-foreground" },
    { label: "Productos vendidos", value: m.itemsSold, icon: Package, tone: "text-chart-1" },
    { label: "Pedidos pendientes", value: m.pendingOrders, icon: ShoppingCart, tone: "text-warning" },
    { label: "Clientes registrados", value: m.customers, icon: Users, tone: "text-chart-2" },
    { label: "Inventario bajo", value: m.lowStock, icon: AlertTriangle, tone: "text-warning" },
    { label: "Productos agotados", value: m.outOfStock, icon: Ban, tone: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general de tu tienda
        </p>
      </div>

      {/* Analítica en vivo */}
      <AnalyticsLive />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {k.label}
              </span>
              <k.icon className={`size-4 ${k.tone}`} />
            </div>
            <p className="mt-2 text-xl font-bold tracking-tight">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="size-4" /> Ventas (últimos 14 días)
          </h2>
          <SalesAreaChart data={m.salesByDay} />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <ShoppingCart className="size-4" /> Pedidos por estado
          </h2>
          {m.ordersByStatus.length ? (
            <OrdersStatusChart data={m.ordersByStatus} />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Aún no hay pedidos.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Boxes className="size-4" /> Productos más vendidos
          </h2>
          <TopProductsChart data={m.topProducts} />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold">Detalle top productos</h2>
          <div className="divide-y">
            {m.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-accent text-xs font-semibold">
                    {i + 1}
                  </span>
                  {p.name}
                </span>
                <span className="text-right">
                  <span className="font-medium">{p.sold} uds</span>
                  <span className="ml-2 text-muted-foreground">
                    {formatCOP(p.revenue)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
