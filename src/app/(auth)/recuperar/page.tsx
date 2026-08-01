import type { Metadata } from "next";
import { RecoverForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecoverPage() {
  return <RecoverForm />;
}
