import type { Metadata } from "next";
import { getCurrentUser } from "@/features/auth/api";
import { getUserAddresses } from "@/features/account/api";
import { AddressesManager } from "@/components/shop/addresses-manager";

export const metadata: Metadata = { title: "Mis direcciones" };
export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const user = await getCurrentUser();
  const addresses = user ? await getUserAddresses(user.id) : [];
  return <AddressesManager addresses={addresses} />;
}
