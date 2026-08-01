import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listAddressesLocal } from "./local";
import type { Address } from "@/types/database.types";

export async function getUserAddresses(userId: string): Promise<Address[]> {
  if (!isSupabaseConfigured()) return listAddressesLocal(userId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });
  return (data ?? []) as Address[];
}
