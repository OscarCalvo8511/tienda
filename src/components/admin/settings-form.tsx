"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveSettingsAction } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForm({
  initial,
}: {
  initial: {
    storeName: string;
    contactEmail: string;
    contactPhone: string;
    primaryColor: string;
    instagram: string;
    facebook: string;
    whatsapp: string;
    freeThreshold: number;
    taxRate: number;
  };
}) {
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    await saveSettingsAction({
      storeName: String(fd.get("storeName")),
      contactEmail: String(fd.get("contactEmail")),
      contactPhone: String(fd.get("contactPhone")),
      primaryColor: String(fd.get("primaryColor")),
      instagram: String(fd.get("instagram")),
      facebook: String(fd.get("facebook")),
      whatsapp: String(fd.get("whatsapp")),
      freeThreshold: Number(fd.get("freeThreshold")),
      taxRate: Number(fd.get("taxRate")),
    });
    setSaving(false);
    toast.success("Configuración guardada");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <Card title="Información de la tienda">
        <Field label="Nombre de la tienda" name="storeName" defaultValue={initial.storeName} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Correo de contacto" name="contactEmail" type="email" defaultValue={initial.contactEmail} />
          <Field label="Teléfono" name="contactPhone" defaultValue={initial.contactPhone} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="primaryColor">Color principal</Label>
          <div className="flex items-center gap-2">
            <input
              id="primaryColor"
              name="primaryColor"
              type="color"
              defaultValue={initial.primaryColor}
              className="h-9 w-14 rounded-md border"
            />
            <span className="text-sm text-muted-foreground">{initial.primaryColor}</span>
          </div>
        </div>
      </Card>

      <Card title="Redes sociales">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Instagram" name="instagram" defaultValue={initial.instagram} />
          <Field label="Facebook" name="facebook" defaultValue={initial.facebook} />
          <Field label="WhatsApp" name="whatsapp" defaultValue={initial.whatsapp} />
        </div>
      </Card>

      <Card title="Envíos e impuestos">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Envío gratis desde (COP)" name="freeThreshold" type="number" defaultValue={initial.freeThreshold} />
          <Field label="Tasa de IVA (ej. 0.19)" name="taxRate" type="number" step="0.01" defaultValue={initial.taxRate} />
        </div>
      </Card>

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Guardar cambios
      </Button>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
