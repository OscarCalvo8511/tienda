import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getLocalProfile, getLocalUser } from "@/lib/local/auth";
import type { Profile } from "@/types/database.types";

/** Usuario autenticado (revalidado con el servidor de Auth) o null. */
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    const u = await getLocalUser();
    return u ? { id: u.id, email: u.email } : null;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Perfil del usuario actual (incluye rol). */
export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return getLocalProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return (data as Profile | null) ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === "admin";
}
