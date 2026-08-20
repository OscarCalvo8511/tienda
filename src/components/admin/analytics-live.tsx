"use client";

import { useEffect, useState } from "react";
import { Eye, Radio, ShoppingCart } from "lucide-react";

interface Stats {
  ready: boolean;
  totalViews?: number;
  activeNow?: number;
  abandonedCarts?: number;
}

/**
 * Panel de analítica en vivo: se actualiza cada 5 segundos consultando
 * /api/admin/stats. Muestra vistas totales, visitantes activos ahora y
 * carritos abandonados.
 */
export function AnalyticsLive() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/admin/stats", { cache: "no-store" });
        const d = (await r.json()) as Stats;
        if (alive) setS(d);
      } catch {
        // ignorar; reintenta en el siguiente ciclo
      }
    }
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const nf = new Intl.NumberFormat("es-CO");
  const fmt = (n?: number) => (n == null ? "—" : nf.format(n));

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-success" />
        </span>
        <h2 className="text-sm font-semibold">Analítica en vivo</h2>
        <span className="text-xs text-muted-foreground">
          se actualiza cada 5s
        </span>
      </div>

      {s && !s.ready ? (
        <div className="rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
          Falta activar la base de datos de analítica. Ejecuta el script SQL en
          Supabase y este panel empezará a mostrar datos automáticamente.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card
            label="Vistas totales"
            value={fmt(s?.totalViews)}
            icon={Eye}
            tone="text-brand"
          />
          <Card
            label="Activos ahora"
            value={fmt(s?.activeNow)}
            icon={Radio}
            tone="text-success"
            live
          />
          <Card
            label="Carritos abandonados"
            value={fmt(s?.abandonedCarts)}
            icon={ShoppingCart}
            tone="text-warning"
          />
        </div>
      )}
    </div>
  );
}

function Card({
  label,
  value,
  icon: Icon,
  tone,
  live,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  live?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <Icon className={`size-4 ${tone}`} />
      </div>
      <p className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight">
        {value}
        {live && Number(value.replace(/\D/g, "")) > 0 && (
          <span className="size-2 animate-pulse rounded-full bg-success" />
        )}
      </p>
    </div>
  );
}
