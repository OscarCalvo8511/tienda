"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

/** Cliente de Supabase para componentes de cliente (navegador). */
export function createClient() {
  return createBrowserClient<Database, "tienda">(
    env.supabaseUrl,
    env.supabaseAnonKey,
    { db: { schema: "tienda" } },
  );
}
