import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Registra eventos de analítica anónima (vista, latido de presencia y estado
 * del carrito). Tolerante a fallos: nunca rompe la navegación del cliente.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: string;
      session?: string;
      items?: number;
      value?: number;
    };
    const session =
      typeof body.session === "string" ? body.session.slice(0, 64) : null;
    if (!session) return NextResponse.json({ ok: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;

    if (body.type === "view") {
      await admin.rpc("track_view", { p_session: session });
    } else if (body.type === "ping") {
      await admin.rpc("track_ping", { p_session: session });
    } else if (body.type === "cart") {
      await admin.rpc("track_cart", {
        p_session: session,
        p_items: Math.max(0, Math.min(9999, Math.floor(Number(body.items) || 0))),
        p_value: Math.max(0, Number(body.value) || 0),
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
