"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateProfileAction,
  changePasswordAction,
} from "@/features/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForms({
  fullName,
  phone,
  email,
}: {
  fullName: string;
  phone: string;
  email: string;
}) {
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSavingProfile(true);
    const res = await updateProfileAction({
      full_name: String(fd.get("full_name")),
      phone: String(fd.get("phone")),
    });
    setSavingProfile(false);
    if (res.ok) toast.success("Perfil actualizado");
    else toast.error(res.error ?? "Error");
  }

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSavingPass(true);
    const res = await changePasswordAction({
      current: String(fd.get("current")),
      next: String(fd.get("next")),
    });
    setSavingPass(false);
    if (res.ok) {
      toast.success("Contraseña actualizada");
      form.reset();
    } else {
      toast.error(res.error ?? "Error");
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={saveProfile} className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Información personal</h2>
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" value={email} disabled />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input id="full_name" name="full_name" defaultValue={fullName} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" defaultValue={phone} />
          </div>
        </div>
        <Button type="submit" disabled={savingProfile}>
          {savingProfile && <Loader2 className="size-4 animate-spin" />}
          Guardar
        </Button>
      </form>

      <form onSubmit={savePassword} className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Cambiar contraseña</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="current">Contraseña actual</Label>
            <Input id="current" name="current" type="password" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="next">Nueva contraseña</Label>
            <Input id="next" name="next" type="password" required />
          </div>
        </div>
        <Button type="submit" variant="secondary" disabled={savingPass}>
          {savingPass && <Loader2 className="size-4 animate-spin" />}
          Actualizar contraseña
        </Button>
      </form>
    </div>
  );
}
