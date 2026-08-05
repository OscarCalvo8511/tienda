import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Callback de Supabase Auth: intercambia el código por sesión
 * (OAuth con Google, verificación de correo, recuperación de contraseña).
 *
 * Las cookies de sesión se escriben en la MISMA respuesta de redirección que
 * se devuelve; de lo contrario la sesión no persiste en el primer intento
 * (síntoma: "hay que iniciar sesión dos veces").
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
      db: { schema: "tienda" },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
