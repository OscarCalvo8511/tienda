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
  wompiPublicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ?? "",
};

/**
 * ¿Está configurada la pasarela Wompi?
 * Requiere la llave pública (cliente) y el secreto de integridad (servidor).
 * Si no, el checkout cae al pago simulado (modo demo).
 */
export function isWompiConfigured(): boolean {
  return Boolean(env.wompiPublicKey && serverEnv.wompiIntegritySecret);
}

/** El ambiente de Wompi se deduce del prefijo de la llave pública. */
export function wompiEnv(): "sandbox" | "production" {
  return env.wompiPublicKey.startsWith("pub_prod_") ? "production" : "sandbox";
}

/** Base de la API REST de Wompi según el ambiente. */
export function wompiApiBase(): string {
  return wompiEnv() === "production"
    ? "https://production.wompi.co/v1"
    : "https://sandbox.wompi.co/v1";
}

/**
 * ¿Hay credenciales de Supabase configuradas?
 * Si no, la app funciona en MODO LOCAL (dataset semilla + almacén en archivo).
 * Al cargar las variables NEXT_PUBLIC_SUPABASE_* se activa Supabase sin más cambios.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

/**
 * ¿Está configurado el envío de correos (Resend)?
 * Sin `RESEND_API_KEY` los correos transaccionales se omiten silenciosamente
 * (no rompen el pedido), igual que la pasarela cae a modo simulado sin Wompi.
 */
export function isEmailConfigured(): boolean {
  return Boolean(serverEnv.resendApiKey);
}

/** Remitente de los correos transaccionales de la tienda. */
export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "DyC local store <ventas@dyclocalstore.com>";

/**
 * Correo del administrador que recibe el aviso de cada nueva compra.
 * Fijo por variable de entorno (no depende de la tabla `settings`), con un
 * valor por defecto para que funcione sin configuración extra.
 */
export const ORDER_ADMIN_EMAIL =
  process.env.ORDER_ADMIN_EMAIL ?? "ventas@dyclocalstore.com";

/** Variables solo-servidor. No importar desde componentes cliente. */
export const serverEnv = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  wompiPrivateKey: process.env.WOMPI_PRIVATE_KEY ?? "",
  wompiIntegritySecret: process.env.WOMPI_INTEGRITY_SECRET ?? "",
  wompiEventsSecret: process.env.WOMPI_EVENTS_SECRET ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
};
