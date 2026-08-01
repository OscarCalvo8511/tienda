import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/database.types";
import { cn } from "@/lib/utils";

const MAP: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-muted text-foreground" },
  paid: { label: "Pagado", className: "bg-brand/10 text-brand" },
  preparing: { label: "Preparando", className: "bg-warning/15 text-warning" },
  shipped: { label: "Enviado", className: "bg-chart-2/15 text-chart-2" },
  delivered: { label: "Entregado", className: "bg-success/10 text-success" },
  cancelled: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
  returned: { label: "Devuelto", className: "bg-sale/10 text-sale" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = MAP[status];
  return (
    <Badge variant="secondary" className={cn("border-transparent", s.className)}>
      {s.label}
    </Badge>
  );
}
