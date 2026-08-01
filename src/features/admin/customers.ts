import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { db, mutate } from "@/lib/local/store";
import type { OrderStatus, Profile } from "@/types/database.types";

const PAID: OrderStatus[] = ["paid", "preparing", "shipped", "delivered"];

export interface CustomerRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_blocked: boolean;
  created_at: string;
  orders_count: number;
  total_spent: number;
}

// ============================================================
//  LECTURA
// ============================================================
export async function listCustomers(): Promise<CustomerRow[]> {
  if (!isSupabaseConfigured()) return listLocalCustomers();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*, orders(total, status)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as (Profile & {
    orders: { total: number; status: OrderStatus }[] | null;
  })[];

  return rows.map((u) => {
    const paid = (u.orders ?? []).filter((o) => PAID.includes(o.status));
    return {
      id: u.id,
      email: u.email ?? "",
      full_name: u.full_name,
      role: u.role,
      is_blocked: u.is_blocked,
      created_at: u.created_at,
      orders_count: paid.length,
      total_spent: paid.reduce((s, o) => s + Number(o.total), 0),
    };
  });
}

// ============================================================
//  ESCRITURA
// ============================================================
export async function toggleCustomerBlocked(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    toggleLocalCustomerBlocked(id);
    return;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_blocked")
    .eq("id", id)
    .single();
  const u = data as { is_blocked: boolean } | null;
  if (!u) return;
  const { error } = await supabase
    .from("profiles")
    .update({ is_blocked: !u.is_blocked })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCustomer(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    deleteLocalCustomer(id);
    return;
  }
  const supabase = await createClient();
  // Elimina el perfil de la tienda (el usuario de auth.users permanece;
  // borrarlo requiere la Admin API con service_role).
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
//  MODO LOCAL
// ============================================================
function listLocalCustomers(): CustomerRow[] {
  const d = db();
  return d.users.map((u) => {
    const orders = d.orders.filter(
      (o) => o.user_id === u.id && PAID.includes(o.status),
    );
    return {
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      is_blocked: u.is_blocked,
      created_at: u.created_at,
      orders_count: orders.length,
      total_spent: orders.reduce((s, o) => s + o.total, 0),
    };
  });
}

function toggleLocalCustomerBlocked(id: string) {
  mutate((d) => {
    const u = d.users.find((x) => x.id === id);
    if (u) u.is_blocked = !u.is_blocked;
  });
}

function deleteLocalCustomer(id: string) {
  mutate((d) => {
    d.users = d.users.filter((u) => u.id !== id);
    d.sessions = d.sessions.filter((s) => s.user_id !== id);
  });
}
