import { getDashboardMetrics } from "@/features/admin/metrics";
import { ExportButtons } from "@/components/admin/export-buttons";
import { formatCOP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const m = await getDashboardMetrics();

  const salesRows = m.salesByDay.map((d) => ({
    Fecha: d.date,
    Ventas: d.total,
  }));
  const topRows = m.topProducts.map((p) => ({
    Producto: p.name,
    Unidades: p.sold,
    Ingresos: p.revenue,
  }));
  const statusRows = m.ordersByStatus.map((s) => ({
    Estado: s.status,
    Pedidos: s.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Informes</h1>
        <p className="text-sm text-muted-foreground">
          Exporta reportes en CSV, Excel o PDF
        </p>
      </div>

      <Section title="Ventas por día (14 días)" rows={salesRows} filename="ventas-por-dia">
        <Table
          headers={["Fecha", "Ventas"]}
          rows={m.salesByDay.map((d) => [d.date, formatCOP(d.total)])}
        />
      </Section>

      <Section title="Productos más vendidos" rows={topRows} filename="top-productos">
        <Table
          headers={["Producto", "Unidades", "Ingresos"]}
          rows={m.topProducts.map((p) => [p.name, String(p.sold), formatCOP(p.revenue)])}
        />
      </Section>

      <Section title="Pedidos por estado" rows={statusRows} filename="pedidos-por-estado">
        <Table
          headers={["Estado", "Pedidos"]}
          rows={m.ordersByStatus.map((s) => [s.status, String(s.count)])}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  rows,
  filename,
  children,
}: {
  title: string;
  rows: Record<string, string | number>[];
  filename: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <ExportButtons rows={rows} filename={filename} />
      </div>
      {children}
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            {headers.map((h) => (
              <th key={h} className="p-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="p-3">{c}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} className="p-6 text-center text-muted-foreground">Sin datos.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
