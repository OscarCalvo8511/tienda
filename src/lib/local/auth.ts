import "server-only";
import { cookies } from "next/headers";
import {
  db,
  mutate,
  uid,
  hashPassword,
  verifyPassword,
  type LocalUser,
} from "./store";
import type { Profile } from "@/types/database.types";

const COOKIE = "local_session";

function toProfile(u: LocalUser): Profile {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    phone: u.phone,
    avatar_url: null,
    role: u.role,
    is_blocked: u.is_blocked,
    created_at: u.created_at,
    updated_at: u.created_at,
  };
}

/** Usuario local a partir de la cookie de sesión. */
export async function getLocalUser(): Promise<LocalUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const database = db();
  const session = database.sessions.find((s) => s.token === token);
  if (!session) return null;
  return database.users.find((u) => u.id === session.user_id) ?? null;
}

export async function getLocalProfile(): Promise<Profile | null> {
  const u = await getLocalUser();
  return u ? toProfile(u) : null;
}

export async function localSignIn(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = db().users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { ok: false, error: "Credenciales incorrectas." };
  }
  if (user.is_blocked) return { ok: false, error: "Cuenta bloqueada." };

  const token = uid("sess");
  mutate((d) =>
    d.sessions.push({
      token,
      user_id: user.id,
      created_at: new Date().toISOString(),
    }),
  );
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { ok: true };
}

export async function localSignUp(
  email: string,
  password: string,
  fullName: string,
): Promise<{ ok: boolean; error?: string }> {
  const exists = db().users.some(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (exists) return { ok: false, error: "Ese correo ya está registrado." };

  const user: LocalUser = {
    id: uid("user"),
    email,
    full_name: fullName,
    phone: null,
    role: "customer",
    is_blocked: false,
    password_hash: hashPassword(password),
    created_at: new Date().toISOString(),
  };
  const token = uid("sess");
  mutate((d) => {
    d.users.push(user);
    d.sessions.push({
      token,
      user_id: user.id,
      created_at: new Date().toISOString(),
    });
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { ok: true };
}

export async function localSignOut() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) mutate((d) => (d.sessions = d.sessions.filter((s) => s.token !== token)));
  jar.delete(COOKIE);
}
