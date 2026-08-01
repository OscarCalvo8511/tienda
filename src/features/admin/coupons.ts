import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { db, mutate, uid } from "@/lib/local/store";
import type { Coupon, CouponType } from "@/types/database.types";

export interface CouponInput {
  code: string;
  description?: string | null;
  type: CouponType;
  value: number;
  min_purchase?: number;
  max_uses?: number | null;
  max_uses_per_user?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
}

// ============================================================
//  LECTURA
// ============================================================
export async function listCoupons(): Promise<Coupon[]> {
  if (!isSupabaseConfigured()) return listLocalCoupons();
  const supabase = await createClient();
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Coupon[];
}

// ============================================================
//  ESCRITURA
// ============================================================
export async function createCoupon(input: CouponInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    createLocalCoupon(input);
    return;
  }
  const supabase = await createClient();
  const code = input.code.toUpperCase();
  // upsert por código (citext único)
  const { error } = await supabase.from("coupons").upsert(
    {
      code,
      description: input.description ?? null,
      type: input.type,
      value: input.value,
      min_purchase: input.min_purchase ?? 0,
      max_uses: input.max_uses ?? null,
      max_uses_per_user: input.max_uses_per_user ?? null,
      starts_at: input.starts_at ?? null,
      expires_at: input.expires_at ?? null,
      is_active: input.is_active ?? true,
    } as never,
    { onConflict: "code" },
  );
  if (error) throw error;
}

export async function deleteCoupon(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    deleteLocalCoupon(id);
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
//  MODO LOCAL
// ============================================================
function listLocalCoupons(): Coupon[] {
  return [...db().coupons].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
}

function createLocalCoupon(input: CouponInput): Coupon {
  const id = uid("coupon");
  return mutate((d) => {
    const coupon: Coupon = {
      id,
      code: input.code.toUpperCase(),
      description: input.description ?? null,
      type: input.type,
      value: input.value,
      min_purchase: input.min_purchase ?? 0,
      max_uses: input.max_uses ?? null,
      uses_count: 0,
      max_uses_per_user: input.max_uses_per_user ?? null,
      starts_at: input.starts_at ?? null,
      expires_at: input.expires_at ?? null,
      is_active: input.is_active ?? true,
      created_at: new Date().toISOString(),
    };
    d.coupons = d.coupons.filter(
      (c) => c.code.toLowerCase() !== coupon.code.toLowerCase(),
    );
    d.coupons.push(coupon);
    return coupon;
  });
}

function deleteLocalCoupon(id: string) {
  mutate((d) => {
    d.coupons = d.coupons.filter((c) => c.id !== id);
  });
}
