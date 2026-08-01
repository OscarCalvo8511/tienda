import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { localGetSettings } from "@/lib/local/queries";
import type { Json } from "@/types/database.types";

export interface StoreSettings {
  name: string;
  logo_url: string | null;
  primary_color: string;
  contact_email: string;
  contact_phone: string;
  social: { instagram?: string; facebook?: string; whatsapp?: string };
}

export interface ShippingSettings {
  free_threshold: number;
  methods: { id: string; name: string; price: number }[];
}

export interface TaxSettings {
  rate: number;
  included: boolean;
}

const DEFAULT_STORE: StoreSettings = {
  name: "Tienda",
  logo_url: null,
  primary_color: "#171717",
  contact_email: "contacto@tienda.co",
  contact_phone: "+57 300 000 0000",
  social: {},
};

const DEFAULT_SHIPPING: ShippingSettings = {
  free_threshold: 200000,
  methods: [
    { id: "standard", name: "Envío estándar (3-5 días)", price: 12000 },
    { id: "express", name: "Envío express (1-2 días)", price: 25000 },
  ],
};

const DEFAULT_TAX: TaxSettings = { rate: 0.19, included: true };

export async function getSettings() {
  if (!isSupabaseConfigured()) {
    const s = localGetSettings();
    return {
      store: { ...DEFAULT_STORE, ...s.store },
      shipping: { ...DEFAULT_SHIPPING, ...s.shipping },
      tax: { ...DEFAULT_TAX, ...s.tax },
    };
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("settings").select("key, value");
    const rows = (data ?? []) as { key: string; value: Json }[];
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      store: { ...DEFAULT_STORE, ...(map.get("store") as object) },
      shipping: { ...DEFAULT_SHIPPING, ...(map.get("shipping") as object) },
      tax: { ...DEFAULT_TAX, ...(map.get("tax") as object) },
    } as { store: StoreSettings; shipping: ShippingSettings; tax: TaxSettings };
  } catch {
    return { store: DEFAULT_STORE, shipping: DEFAULT_SHIPPING, tax: DEFAULT_TAX };
  }
}
