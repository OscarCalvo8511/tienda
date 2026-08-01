import { getSettings } from "@/features/settings/api";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { store, shipping, tax } = await getSettings();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-sm text-muted-foreground">Ajustes generales de la tienda</p>
      </div>
      <SettingsForm
        initial={{
          storeName: store.name,
          contactEmail: store.contact_email,
          contactPhone: store.contact_phone,
          primaryColor: store.primary_color,
          instagram: store.social.instagram ?? "",
          facebook: store.social.facebook ?? "",
          whatsapp: store.social.whatsapp ?? "",
          freeThreshold: shipping.free_threshold,
          taxRate: tax.rate,
        }}
      />
    </div>
  );
}
