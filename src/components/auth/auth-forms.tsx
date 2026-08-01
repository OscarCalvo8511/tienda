"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  signInAction,
  signUpAction,
  resetPasswordAction,
  type ActionState,
} from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "./google-button";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}

function Feedback({ state }: { state: ActionState }) {
  if (!state) return null;
  if (state.error)
    return (
      <p className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" /> {state.error}
      </p>
    );
  if (state.success)
    return (
      <p className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm text-success">
        <CheckCircle2 className="size-4 shrink-0" /> {state.success}
      </p>
    );
  return null;
}

const Divider = () => (
  <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
    <span className="h-px flex-1 bg-border" /> o <span className="h-px flex-1 bg-border" />
  </div>
);

export function LoginForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const [state, action] = useActionState<ActionState, FormData>(
    signInAction,
    null,
  );
  return (
    <div>
      <h1 className="text-xl font-bold">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ingresa a tu cuenta para continuar.
      </p>
      <GoogleButton next={redirectTo} />
      <Divider />
      <form action={action} className="space-y-4">
        <input type="hidden" name="redirect" value={redirectTo} />
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <Feedback state={state} />
        <SubmitButton>Ingresar</SubmitButton>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/recuperar" className="text-brand hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
        <Link href="/registro" className="text-brand hover:underline">
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState<ActionState, FormData>(
    signUpAction,
    null,
  );
  return (
    <div>
      <h1 className="text-xl font-bold">Crear cuenta</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Regístrate para comprar más rápido.
      </p>
      <GoogleButton />
      <Divider />
      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nombre completo</Label>
          <Input id="fullName" name="fullName" required autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" required autoComplete="new-password" />
        </div>
        <Feedback state={state} />
        <SubmitButton>Crear cuenta</SubmitButton>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-brand hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}

export function RecoverForm() {
  const [state, action] = useActionState<ActionState, FormData>(
    resetPasswordAction,
    null,
  );
  return (
    <div>
      <h1 className="text-xl font-bold">Recuperar contraseña</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Te enviaremos un enlace a tu correo.
      </p>
      <form action={action} className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <Feedback state={state} />
        <SubmitButton>Enviar enlace</SubmitButton>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-brand hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
