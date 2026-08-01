import { NextResponse, type NextRequest } from "next/server";
import { isWompiConfigured } from "@/lib/env";
import {
  verifyWompiEventChecksum,
  type WompiEvent,
} from "@/lib/payments/wompi-provider";
import {
  confirmOrderPayment,
  failOrderPayment,
  getOrderForPayment,
} from "@/features/orders/api";

export const runtime = "nodejs";

/**
 * Webhook de eventos de Wompi (transaction.updated).
 * Verifica el checksum (SHA256 de las propiedades + timestamp + events secret)
 * y confirma/rechaza el pedido de forma idempotente.
 */
export async function POST(request: NextRequest) {
  if (!isWompiConfigured()) {
    return NextResponse.json({ received: true, skipped: "not-configured" });
  }

  let event: WompiEvent;
  try {
    event = (await request.json()) as WompiEvent;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!verifyWompiEventChecksum(event)) {
    console.error("[wompi] firma de evento inválida");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const tx = event.data?.transaction;
  if (!tx?.reference || !tx.status) {
    return NextResponse.json({ received: true, skipped: "no-transaction" });
  }

  try {
    const order = await getOrderForPayment(tx.reference);
    if (!order) {
      return NextResponse.json({ received: true, skipped: "order-not-found" });
    }

    const amountInCents = tx.amount_in_cents ?? 0;
    const amount = amountInCents / 100;

    // El monto de la transacción debe coincidir con el del pedido.
    if (Math.round(order.total * 100) !== amountInCents) {
      console.error(
        `[wompi] monto no coincide para ${tx.reference}: ${amountInCents} vs ${order.total * 100}`,
      );
      return NextResponse.json({ received: true, skipped: "amount-mismatch" });
    }

    const ref = tx.id ?? tx.reference;
    if (tx.status === "APPROVED") {
      await confirmOrderPayment(order.id, ref, amount);
    } else if (
      tx.status === "DECLINED" ||
      tx.status === "VOIDED" ||
      tx.status === "ERROR"
    ) {
      await failOrderPayment(order.id, ref, amount);
    }
    // PENDING: se espera el evento final.
  } catch (err) {
    console.error("[wompi] error procesando webhook:", err);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
