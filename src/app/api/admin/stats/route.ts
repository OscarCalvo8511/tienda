import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/features/auth/api";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Métricas en vivo para el panel de admin: vistas totales, visitantes activos
 * ahora y carritos abandonados. Solo para administradores. Si la tabla de
 * analítica aún no existe, responde { ready: false } sin romper.
 */
export async function GET() {
  const profile = await getCurrentProfile().catch(() => null);
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "no autorizado" }, { status: 403 });
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { data, error } = await admin.rpc("get_live_stats");
    if (error) return NextResponse.json({ ready: false });
    return NextResponse.json({
      ready: true,
      totalViews: Number(data?.totalViews ?? 0),
      activeNow: Number(data?.activeNow ?? 0),
      abandonedCarts: Number(data?.abandonedCarts ?? 0),
    });
  } catch {
    return NextResponse.json({ ready: false });
  }
}
