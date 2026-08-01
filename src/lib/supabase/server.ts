import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env, serverEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Usa las cookies de la petición para mantener la sesión del usuario.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database, "tienda">(env.supabaseUrl, env.supabaseAnonKey, {
    db: { schema: "tienda" },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Invocado desde un Server Component: se ignora.
          // El middleware se encarga de refrescar la sesión.
        }
      },
    },
  });
}

/**
 * Cliente con service_role — omite RLS.
 * SOLO usar en servidor para tareas administrativas controladas
 * (webhooks de pago, jobs, operaciones de sistema). Nunca en cliente.
 */
export function createAdminClient() {
  return createSupabaseClient<Database, "tienda">(
    env.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    {
      db: { schema: "tienda" },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
