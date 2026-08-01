import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { db, mutate, uid } from "@/lib/local/store";
import type {
  InventoryMovement,
  InventoryMovementType,
} from "@/types/database.types";

export interface InventoryRow {
  productId: string;
  name: string;
  sku: string | null;
  quantity: number;
  lowStockThreshold: number;
  status: "ok" | "low" | "out";
}

export interface InventoryAdjustInput {
  productId: string;
  delta: number;
  type: InventoryMovementType;
  reason?: string | null;
  createdBy?: string | null;
}

// ============================================================
//  LECTURA
// ============================================================
export async function listInventory(): Promise<InventoryRow[]> {
  if (!isSupabaseConfigured()) return listLocalInventory();
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, sku, inventory(quantity, low_stock_threshold)")
    .order("name", { ascending: true });

  const rows = (data ?? []) as {
    id: string;
    name: string;
    sku: string | null;
    inventory: { quantity: number; low_stock_threshold: number }[] | null;
  }[];

  return rows.map((p) => {
    const inv = p.inventory?.[0];
    const qty = inv?.quantity ?? 0;
    const threshold = inv?.low_stock_threshold ?? 5;
    return {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      quantity: qty,
      lowStockThreshold: threshold,
      status: qty <= 0 ? "out" : qty <= threshold ? "low" : "ok",
    };
  });
}

export async function listMovements(
  limit = 50,
): Promise<(InventoryMovement & { product_name: string })[]> {
  if (!isSupabaseConfigured()) return listLocalMovements(limit);
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_movements")
    .select("*, products(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as (InventoryMovement & {
    products: { name: string } | null;
  })[];

  return rows.map((m) => {
    const { products, ...mov } = m;
    return {
      ...(mov as InventoryMovement),
      product_name: products?.name ?? "—",
    };
  });
}

// ============================================================
//  ESCRITURA
// ============================================================
export async function adjustInventory(
  input: InventoryAdjustInput,
): Promise<number> {
  if (!isSupabaseConfigured()) return adjustLocalInventory(input);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("adjust_inventory", {
    p_product_id: input.productId,
    p_delta: input.delta,
    p_type: input.type,
    p_reason: input.reason ?? null,
    p_variant_id: null,
  } as never);
  if (error) throw error;
  return (data as number) ?? 0;
}

// ============================================================
//  MODO LOCAL
// ============================================================
function listLocalInventory(): InventoryRow[] {
  const d = db();
  return d.products.map((p) => {
    const inv = d.inventory.find((i) => i.product_id === p.id);
    const qty = inv?.quantity ?? 0;
    const threshold = inv?.low_stock_threshold ?? 5;
    return {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      quantity: qty,
      lowStockThreshold: threshold,
      status: qty <= 0 ? "out" : qty <= threshold ? "low" : "ok",
    };
  });
}

function listLocalMovements(
  limit = 50,
): (InventoryMovement & { product_name: string })[] {
  const d = db();
  return [...d.inventory_movements]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map((m) => ({
      ...m,
      product_name: d.products.find((p) => p.id === m.product_id)?.name ?? "—",
    }));
}

function adjustLocalInventory(input: InventoryAdjustInput): number {
  return mutate((d) => {
    let inv = d.inventory.find(
      (i) => i.product_id === input.productId && i.variant_id === null,
    );
    const prev = inv?.quantity ?? 0;
    const next = Math.max(0, prev + input.delta);
    if (inv) {
      inv.quantity = next;
      inv.updated_at = new Date().toISOString();
    } else {
      inv = {
        id: uid("inv"),
        product_id: input.productId,
        variant_id: null,
        quantity: next,
        low_stock_threshold: 5,
        updated_at: new Date().toISOString(),
      };
      d.inventory.push(inv);
    }

    d.inventory_movements.push({
      id: uid("mov"),
      product_id: input.productId,
      variant_id: null,
      type: input.type,
      quantity: input.delta,
      previous_qty: prev,
      new_qty: next,
      reason: input.reason ?? null,
      created_by: input.createdBy ?? null,
      created_at: new Date().toISOString(),
    });

    const prod = d.products.find((p) => p.id === input.productId);
    if (prod) {
      if (next <= 0) prod.status = "out_of_stock";
      else if (prod.status === "out_of_stock") prod.status = "available";
    }

    return next;
  });
}
