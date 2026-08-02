import "server-only";
import { Resend } from "resend";
import { EMAIL_FROM, isEmailConfigured, serverEnv } from "@/lib/env";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!isEmailConfigured()) return null;
  if (!client) client = new Resend(serverEnv.resendApiKey);
  return client;
}

/**
 * Envía un correo transaccional vía Resend.
 *
 * Es tolerante a fallos por diseño: si el envío no está configurado o Resend
 * responde error, registra en consola y devuelve `false` sin lanzar, para que
 * un problema de correo nunca rompa la creación de un pedido o un cambio de
 * estado.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) return false;
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
    });
    if (error) {
      console.error("[email] Resend devolvió error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] fallo enviando correo:", err);
    return false;
  }
}
