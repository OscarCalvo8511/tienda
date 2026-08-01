"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getReorderLinesAction } from "@/features/account/actions";
import { useCart } from "@/stores/cart";
import { Button } from "@/components/ui/button";

export function ReorderButton({ orderNumber }: { orderNumber: string }) {
  const [pending, startTransition] = useTransition();
  const addItem = useCart((s) => s.addItem);
  const router = useRouter();

  function reorder() {
    startTransition(async () => {
      const lines = await getReorderLinesAction(orderNumber);
      if (!lines.length) {
        toast.error("Los productos ya no están disponibles");
        return;
      }
      lines.forEach((l) =>
        addItem(
          {
            productId: l.productId,
            slug: l.slug,
            name: l.name,
            image: l.image,
            price: l.price,
            compareAt: l.compareAt,
            maxStock: l.maxStock,
          },
          l.quantity,
        ),
      );
      toast.success("Productos agregados al carrito");
      router.push("/carrito");
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={reorder} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
      Repetir
    </Button>
  );
}
