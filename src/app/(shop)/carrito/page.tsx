import type { Metadata } from "next";
import { CartView } from "@/components/shop/cart-view";
import { getSettings } from "@/features/settings/api";

export const metadata: Metadata = { title: "Carrito de compras" };

export default async function CartPage() {
  const { shipping, tax } = await getSettings();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Carrito de compras</h1>
      <CartView
        freeThreshold={shipping.free_threshold}
        taxRate={tax.rate}
        taxIncluded={tax.included}
      />
    </div>
  );
}
