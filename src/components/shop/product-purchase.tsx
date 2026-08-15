"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "./add-to-cart-button";
import { PaymentBadges } from "./payment-badges";
import { useCart, type CartLine } from "@/stores/cart";

export function ProductPurchase({
  line,
  maxStock,
  disabled,
}: {
  line: Omit<CartLine, "quantity">;
  maxStock: number;
  disabled?: boolean;
}) {
  const [qty, setQty] = useState(1);
  const addItem = useCart((s) => s.addItem);
  const router = useRouter();

  function buyNow() {
    addItem(line, qty);
    toast.success("Vamos al pago");
    router.push("/checkout");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Cantidad</span>
        <div className="flex items-center rounded-md border">
          <button
            className="grid size-9 place-items-center hover:bg-accent disabled:opacity-40"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Disminuir"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center text-sm font-medium">{qty}</span>
          <button
            className="grid size-9 place-items-center hover:bg-accent disabled:opacity-40"
            onClick={() => setQty((q) => Math.min(maxStock || 99, q + 1))}
            disabled={qty >= (maxStock || 99)}
            aria-label="Aumentar"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {maxStock > 0 && maxStock <= 5 && (
          <span className="text-xs text-sale">¡Solo quedan {maxStock}!</span>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <AddToCartButton
          line={line}
          quantity={qty}
          disabled={disabled}
          size="lg"
          className="flex-1 cta-move cta-shine"
        />
        <Button
          onClick={buyNow}
          disabled={disabled}
          size="lg"
          className="flex-1 cta-buy cta-shine border-0 bg-gradient-to-r from-brand to-sale font-semibold text-white hover:from-brand hover:to-sale hover:text-white"
        >
          <Zap className="cta-icon size-4" /> Comprar ahora
        </Button>
      </div>

      <PaymentBadges className="pt-1" />
    </div>
  );
}
