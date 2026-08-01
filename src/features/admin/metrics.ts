import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { db } from "@/lib/local/store";
import type { OrderStatus } from "@/types/database.types";

const PAID_STATES: OrderStatus[] = ["paid", "preparing", "shipped", "delivered"];

export interface DashboardMetrics {
  salesToday: number;
  salesMonth: number;
  itemsSold: number;
  pendingOrders: number;
  lowStock: number;
  customers: number;
  totalRevenue: number;
  outOfStock: number;
  topProducts: { name: string; sold: number; revenue: number }[];
  salesByDay: { date: string; total: number }[];
  ordersByStatus: { status: string; count: number }[];
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  returned: "Devuelto",
};

interface OrderLite {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
}
interface ItemLite {
  order_id: string;
  quantity: number;
}
interface InvLite {
  quantity: number;
  low_stock_threshold: number;
}
interface ProdLite {
  name: string;
  sold_count: number;
  price: number;
  sale_price: number | null;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (!isSupabaseConfigured()) return getLocalDashboardMetrics();
  const supabase = await createClient();

  const [ordersRes, itemsRes, invRes, prodsRes, custRes] = await Promise.all([
    supabase.from("orders").select("id, status, total, created_at"),
    supabase.from("order_items").select("order_id, quantity"),
    supabase.from("inventory").select("quantity, low_stock_threshold"),
    supabase
      .from("products")
      .select("name, sold_count, price, sale_price")
      .order("sold_count", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "customer"),
  ]);

  const orders = (ordersRes.data ?? []) as OrderLite[];
  const items = (itemsRes.data ?? []) as ItemLite[];
  const inventory = (invRes.data ?? []) as InvLite[];
  const products = (prodsRes.data ?? []) as ProdLite[];
  const customers = custRes.count ?? 0;

  return compute(orders, items, inventory, products, customers);
}

function compute(
  orders: OrderLite[],
  items: ItemLite[],
  inventory: InvLite[],
  topProds: ProdLite[],
  customers: number,
): DashboardMetrics {
  const now = new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const paidOrders = orders.filter((o) => PAID_STATES.includes(o.status));
  const num = (v: number) => Number(v) || 0;

  const salesToday = paidOrders
    .filter((o) => new Date(o.created_at) >= startDay)
    .reduce((s, o) => s + num(o.total), 0);
  const salesMonth = paidOrders
    .filter((o) => new Date(o.created_at) >= startMonth)
    .reduce((s, o) => s + num(o.total), 0);
  const totalRevenue = paidOrders.reduce((s, o) => s + num(o.total), 0);

  const paidIds = new Set(paidOrders.map((o) => o.id));
  const itemsSold = items
    .filter((i) => paidIds.has(i.order_id))
    .reduce((s, i) => s + i.quantity, 0);

  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "preparing",
  ).length;

  const lowStock = inventory.filter(
    (i) => i.quantity > 0 && i.quantity <= i.low_stock_threshold,
  ).length;
  const outOfStock = inventory.filter((i) => i.quantity <= 0).length;

  const topProducts = topProds.map((p) => ({
    name: p.name,
    sold: p.sold_count,
    revenue: p.sold_count * num(p.sale_price ?? p.price),
  }));

  const salesByDay: { date: string; total: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(startDay);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const total = paidOrders
      .filter((o) => {
        const t = new Date(o.created_at);
        return t >= day && t < next;
      })
      .reduce((s, o) => s + num(o.total), 0);
    salesByDay.push({
      date: day.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit" }),
      total,
    });
  }

  const counts = new Map<string, number>();
  for (const o of orders) {
    const label = STATUS_LABELS[o.status];
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const ordersByStatus = [...counts.entries()].map(([status, count]) => ({
    status,
    count,
  }));

  return {
    salesToday,
    salesMonth,
    itemsSold,
    pendingOrders,
    lowStock,
    customers,
    totalRevenue,
    outOfStock,
    topProducts,
    salesByDay,
    ordersByStatus,
  };
}

// ============================================================
//  MODO LOCAL
// ============================================================
function getLocalDashboardMetrics(): DashboardMetrics {
  const d = db();
  const orders = d.orders.map((o) => ({
    id: o.id,
    status: o.status,
    total: o.total,
    created_at: o.created_at,
  }));
  const items = d.order_items.map((i) => ({
    order_id: i.order_id,
    quantity: i.quantity,
  }));
  const inventory = d.inventory.map((i) => ({
    quantity: i.quantity,
    low_stock_threshold: i.low_stock_threshold,
  }));
  const topProds = [...d.products]
    .sort((a, b) => b.sold_count - a.sold_count)
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      sold_count: p.sold_count,
      price: p.price,
      sale_price: p.sale_price,
    }));
  const customers = d.users.filter((u) => u.role === "customer").length;
  return compute(orders, items, inventory, topProds, customers);
}
