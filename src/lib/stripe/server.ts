import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

/**
 * Cliente de Stripe (solo servidor).
 * Se instancia perezosamente para no romper el build si falta la clave.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!serverEnv.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY no está configurada");
  }
  if (!_stripe) {
    _stripe = new Stripe(serverEnv.stripeSecretKey, {
      typescript: true,
    });
  }
  return _stripe;
}
