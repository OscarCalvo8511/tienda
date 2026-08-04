import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { getSettings } from "@/features/settings/api";
import { getCurrentProfile } from "@/features/auth/api";
import { getUserAddresses } from "@/features/account/api";
import { isWompiConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Finalizar compra" };

export default async function CheckoutPage() {
  const [{ shipping, tax }, profile] = await Promise.all([
    getSettings(),
    getCurrentProfile().catch(() => null),
  ]);

  const addresses = profile
    ? await getUserAddresses(profile.id).catch(() => [])
    : [];
  const saved = addresses[0] ?? null;
  const defaultAddress = saved
    ? {
        full_name: saved.full_name,
        phone: saved.phone,
        line1: saved.line1,
        line2: saved.line2,
        city: saved.city,
        department: saved.department,
      }
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/carrito"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Volver al carrito
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Finalizar compra</h1>
      <CheckoutForm
        methods={shipping.methods}
        freeThreshold={shipping.free_threshold}
        taxRate={tax.rate}
        taxIncluded={tax.included}
        defaultEmail={profile?.email ?? ""}
        defaultAddress={defaultAddress}
        wompiEnabled={isWompiConfigured()}
      />
    </div>
  );
}
