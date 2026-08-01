import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import { env, serverEnv, wompiApiBase } from "@/lib/env";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProviderAdapter,
} from "./provider";

export type WompiStatus = "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | "PENDING";

export interface WompiTransaction {
  id: string;
  reference: string;
  status: WompiStatus;
  amount_in_cents: number;
  currency: string;
}

export interface WompiEvent {
  event: string;
  data: { transaction?: Partial<WompiTransaction> };
  signature: { properties: string[]; checksum: string; timestamp?: number };
  timestamp?: number;
}

/**
 * Adaptador de Wompi (Colombia) usando Web Checkout por redirección.
 * El cliente se envía a la página segura de Wompi (PSE, Nequi, tarjetas,
 * Bancolombia) y el pago se confirma de forma asíncrona por webhook.
 *
 * - Los montos van en centavos: COP $95.000 => 9500000 (pesos * 100).
 * - La firma de integridad es SHA256(reference + amount_in_cents + currency +
 *   WOMPI_INTEGRITY_SECRET) y se genera siempre en servidor.
 * Doc: https://docs.wompi.co/docs/colombia/widget-checkout-web/
 */
const CHECKOUT_URL = "https://checkout.wompi.co/p/";

/** Convierte a centavos. Wompi los exige incluso para COP (no es zero-decimal). */
export function toWompiCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Firma de integridad exigida por Web Checkout. */
export function wompiIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
): string {
  const raw = `${reference}${amountInCents}${currency}${serverEnv.wompiIntegritySecret}`;
  return createHash("sha256").update(raw).digest("hex");
}

export const wompiProvider: PaymentProviderAdapter = {
  name: "wompi",

  async createCheckout(
    input: CreateCheckoutInput,
  ): Promise<CreateCheckoutResult> {
    const currency = input.currency.toUpperCase();
    const amountInCents = toWompiCents(input.amount);
    const reference = input.orderNumber;
    const signature = wompiIntegritySignature(reference, amountInCents, currency);

    const params = new URLSearchParams({
      "public-key": env.wompiPublicKey,
      currency,
      "amount-in-cents": String(amountInCents),
      reference,
      "signature:integrity": signature,
      "redirect-url": input.successUrl,
    });
    if (input.customerEmail) {
      params.set("customer-data:email", input.customerEmail);
    }
    if (input.customerName) {
      params.set("customer-data:full-name", input.customerName);
    }
    if (input.customerPhone) {
      params.set("customer-data:phone-number", input.customerPhone);
    }

    return {
      redirectUrl: `${CHECKOUT_URL}?${params.toString()}`,
      reference,
    };
  },
};

/** Comparación de hex en tiempo constante (evita timing attacks). */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/**
 * Verifica la firma de un evento (webhook) de Wompi:
 * SHA256(valores de signature.properties + timestamp + WOMPI_EVENTS_SECRET).
 */
export function verifyWompiEventChecksum(event: WompiEvent): boolean {
  if (!serverEnv.wompiEventsSecret) return false;
  const props = event.signature?.properties ?? [];
  const checksum = event.signature?.checksum;
  if (!checksum || props.length === 0) return false;

  const concatenated = props
    .map((path) =>
      String(
        path.split(".").reduce<unknown>((acc, key) => {
          if (acc && typeof acc === "object") {
            return (acc as Record<string, unknown>)[key];
          }
          return undefined;
        }, event.data as unknown) ?? "",
      ),
    )
    .join("");

  const ts = event.timestamp ?? event.signature?.timestamp ?? "";
  const raw = `${concatenated}${ts}${serverEnv.wompiEventsSecret}`;
  const expected = createHash("sha256").update(raw).digest("hex");
  return timingSafeEqualHex(expected, checksum.toLowerCase());
}

/** Consulta una transacción por id en la API de Wompi (respaldo del retorno). */
export async function fetchWompiTransaction(
  id: string,
): Promise<WompiTransaction | null> {
  const res = await fetch(
    `${wompiApiBase()}/transactions/${encodeURIComponent(id)}`,
    {
      headers: { Authorization: `Bearer ${env.wompiPublicKey}` },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: WompiTransaction };
  return json?.data ?? null;
}
