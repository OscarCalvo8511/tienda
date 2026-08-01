import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

// Stripe requiere el cuerpo sin procesar para verificar la firma.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!serverEnv.stripeWebhookSecret || !serverEnv.stripeSecretKey) {
    return NextResponse.json({ received: true, skipped: "not-configured" });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      serverEnv.stripeWebhookSecret,
    );
  } catch (err) {
    console.error("[stripe] firma inválida:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          const admin = createAdminClient();
          await admin
            .from("orders")
            .update({ status: "paid" })
            .eq("id", orderId);
          await admin.from("payments").insert({
            order_id: orderId,
            provider: "stripe",
            provider_payment_id: session.id,
            status: "approved",
            amount: (session.amount_total ?? 0),
            currency: (session.currency ?? "cop").toUpperCase(),
            raw: session as unknown as Json,
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe] error procesando webhook:", err);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
