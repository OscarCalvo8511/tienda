"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useFavorites } from "@/stores/favorites";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const toggle = useFavorites((s) => s.toggle);
  const ids = useFavorites((s) => s.ids);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = mounted && ids.includes(productId);

  return (
    <button
      type="button"
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        toggle(productId);
        toast(active ? "Quitado de favoritos" : "Agregado a favoritos");
      }}
      className={cn(
        "grid size-8 place-items-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition hover:bg-background",
        className,
      )}
    >
      <Heart
        className={cn("size-4", active && "fill-sale text-sale")}
      />
    </button>
  );
}
