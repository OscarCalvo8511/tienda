import type { Metadata } from "next";
import { FavoritesView } from "@/components/shop/favorites-view";

export const metadata: Metadata = { title: "Mis favoritos" };

export default function FavoritesPage() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Lista de deseos</h2>
      <FavoritesView />
    </div>
  );
}
