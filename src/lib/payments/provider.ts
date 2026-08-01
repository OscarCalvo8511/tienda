/**
 * Contrato común de pasarelas de pago.
 * Implementaciones: Stripe (activo). Preparado para Mercado Pago, PayPal,
 * Wompi y PayU — basta con crear un módulo que cumpla PaymentProvider
 * y registrarlo en `getPaymentProvider`.
 */
import type { PaymentProvider as ProviderName } from "@/types/database.types";

export interface CheckoutLine {
  name: string;
  unitAmount: number; // en la unidad menor si la pasarela lo exige
  quantity: number;
  image?: string | null;
}

export interface CreateCheckoutInput {
  orderId: string;
  orderNumber: string;
  currency: string;
  /** Total a cobrar, en la unidad principal de la moneda (p. ej. pesos COP). */
  amount: number;
  lines: CheckoutLine[];
  shippingAmount: number;
  discountAmount: number;
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResult {
  /** URL a la que redirigir al cliente para pagar. */
  redirectUrl: string;
  /** Identificador de la sesión/intención en la pasarela. */
  reference: string;
}

export interface PaymentProviderAdapter {
  readonly name: ProviderName;
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
}

import { stripeProvider } from "./stripe-provider";
import { wompiProvider } from "./wompi-provider";

const registry: Partial<Record<ProviderName, PaymentProviderAdapter>> = {
  stripe: stripeProvider,
  wompi: wompiProvider,
  // mercadopago: mercadoPagoProvider,
  // payu: payuProvider,
  // paypal: paypalProvider,
};

export function getPaymentProvider(
  name: ProviderName = "stripe",
): PaymentProviderAdapter {
  const provider = registry[name];
  if (!provider) {
    throw new Error(`Pasarela de pago no soportada aún: ${name}`);
  }
  return provider;
}
