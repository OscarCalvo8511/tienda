"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { env, isSupabaseConfigured } from "@/lib/env";
import { localSignIn, localSignUp, localSignOut } from "@/lib/local/auth";

const credentialsSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const signUpSchema = credentialsSchema.extend({
  fullName: z.string().min(2, "Ingresa tu nombre"),
});

export type ActionState = { error?: string; success?: string } | null;

export async function signInAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const redirectTo = (formData.get("redirect") as string) || "/";

  if (!isSupabaseConfigured()) {
    const res = await localSignIn(parsed.data.email, parsed.data.password);
    if (!res.ok) return { error: res.error };
    revalidatePath("/", "layout");
    redirect(redirectTo);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Credenciales incorrectas o correo no verificado." };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  if (!isSupabaseConfigured()) {
    const res = await localSignUp(
      parsed.data.email,
      parsed.data.password,
      parsed.data.fullName,
    );
    if (!res.ok) return { error: res.error };
    revalidatePath("/", "layout");
    redirect("/");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // `app: "tienda"` marca el registro como de la tienda: el trigger
      // tienda.handle_new_user() solo crea el perfil cuando ve esta marca,
      // así los usuarios del otro proyecto (curso) no aparecen aquí.
      data: { full_name: parsed.data.fullName, app: "tienda" },
      emailRedirectTo: `${env.siteUrl}/auth/callback`,
    },
  });
  if (error) {
    return { error: error.message };
  }
  return {
    success:
      "Cuenta creada. Revisa tu correo para verificar tu cuenta antes de ingresar.",
  };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  if (!z.string().email().safeParse(email).success) {
    return { error: "Correo inválido" };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.siteUrl}/auth/callback?next=/cuenta`,
  });
  if (error) return { error: error.message };
  return { success: "Te enviamos un enlace para restablecer tu contraseña." };
}

export async function signOutAction() {
  if (!isSupabaseConfigured()) {
    await localSignOut();
  } else {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}
