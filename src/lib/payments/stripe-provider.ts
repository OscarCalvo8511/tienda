import { getStripe } from "@/lib/stripe/server";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProviderAdapter,
} from "./provider";

/**
 * Adaptador de Stripe usando Checkout Sessions.
 * COP no admite decimales en Stripe (zero-decimal currency),
 * por lo que los montos van sin multiplicar por 100.
 */
const ZERO_DECIMAL = new Set(["COP", "CLP", "JPY", "KRW", "VND"]);

function toStripeAmount(amount: number, currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase())
    ? Math.round(amount)
    : Math.round(amount * 100);
}

export const stripeProvider: PaymentProviderAdapter = {
  name: "stripe",

  async createCheckout(
    input: CreateCheckoutInput,
  ): Promise<CreateCheckoutResult> {
    const stripe = getStripe();
    const currency = input.currency.toLowerCase();

    const line_items = input.lines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency,
        unit_amount: toStripeAmount(line.unitAmount, input.currency),
        product_data: {
          name: line.name,
          ...(line.image ? { images: [line.image] } : {}),
        },
      },
    }));

    // Envío como línea adicional
    if (input.shippingAmount > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toStripeAmount(input.shippingAmount, input.currency),
          product_data: { name: "Envío" },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      customer_email: input.customerEmail ?? undefined,
      client_reference_id: input.orderId,
      metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });

    return {
      redirectUrl: session.url ?? input.cancelUrl,
      reference: session.id,
    };
  },
};
