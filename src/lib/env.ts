/**
 * Acceso centralizado y tipado a variables de entorno.
 * Las públicas (NEXT_PUBLIC_*) están disponibles en cliente y servidor.
 * Las privadas solo deben leerse desde código de servidor.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    // En build/CI puede faltar; avisamos en runtime al usarla.
    if (process.env.NODE_ENV === "production") {
      console.warn(`[env] Falta la variable ${name}`);
    }
    return "";
  }
  return value;
}

export const env = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
};

/**
 * ¿Hay credenciales de Supabase configuradas?
 * Si no, la app funciona en MODO LOCAL (dataset semilla + almacén en archivo).
 * Al cargar las variables NEXT_PUBLIC_SUPABASE_* se activa Supabase sin más cambios.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

/** Variables solo-servidor. No importar desde componentes cliente. */
export const serverEnv = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
};
