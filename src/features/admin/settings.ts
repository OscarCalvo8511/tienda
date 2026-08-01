import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { mutate } from "@/lib/local/store";
import { getSettings } from "@/features/settings/api";

export interface SettingsInput {
  storeName?: string;
  contactEmail?: string;
  contactPhone?: string;
  primaryColor?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  freeThreshold?: number;
  taxRate?: number;
}

export async function updateSettings(input: SettingsInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    updateLocalSettings(input);
    return;
  }
  const supabase = await createClient();
  const current = await getSettings();

  const store = { ...current.store };
  if (input.storeName != null) store.name = input.storeName;
  if (input.contactEmail != null) store.contact_email = input.contactEmail;
  if (input.contactPhone != null) store.contact_phone = input.contactPhone;
  if (input.primaryColor != null) store.primary_color = input.primaryColor;
  store.social = { ...store.social };
  if (input.instagram != null) store.social.instagram = input.instagram;
  if (input.facebook != null) store.social.facebook = input.facebook;
  if (input.whatsapp != null) store.social.whatsapp = input.whatsapp;

  const shipping = { ...current.shipping };
  if (input.freeThreshold != null) shipping.free_threshold = input.freeThreshold;

  const tax = { ...current.tax };
  if (input.taxRate != null) tax.rate = input.taxRate;

  const rows = [
    { key: "store", value: store },
    { key: "shipping", value: shipping },
    { key: "tax", value: tax },
  ];
  const { error } = await supabase
    .from("settings")
    .upsert(rows as never, { onConflict: "key" });
  if (error) throw error;
}

// ============================================================
//  MODO LOCAL
// ============================================================
function updateLocalSettings(input: SettingsInput) {
  mutate((d) => {
    const s = d.settings;
    if (input.storeName != null) s.store.name = input.storeName;
    if (input.contactEmail != null) s.store.contact_email = input.contactEmail;
    if (input.contactPhone != null) s.store.contact_phone = input.contactPhone;
    if (input.primaryColor != null) s.store.primary_color = input.primaryColor;
    if (input.instagram != null) s.store.social.instagram = input.instagram;
    if (input.facebook != null) s.store.social.facebook = input.facebook;
    if (input.whatsapp != null) s.store.social.whatsapp = input.whatsapp;
    if (input.freeThreshold != null)
      s.shipping.free_threshold = input.freeThreshold;
    if (input.taxRate != null) s.tax.rate = input.taxRate;
  });
}
