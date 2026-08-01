"use client";

import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart, type CartLine } from "@/stores/cart";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  line,
  quantity = 1,
  className,
  size = "default",
  disabled,
  label = "Agregar al carrito",
}: {
  line: Omit<CartLine, "quantity">;
  quantity?: number;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  disabled?: boolean;
  label?: string;
}) {
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(line, quantity);
    setAdded(true);
    toast.success("Agregado al carrito", { description: line.name });
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Button
      onClick={handleAdd}
      disabled={disabled}
      size={size}
      className={cn(className)}
    >
      {added ? (
        <Check className="size-4" />
      ) : (
        <ShoppingCart className="size-4" />
      )}
      {size !== "icon" && (added ? "Agregado" : label)}
    </Button>
  );
}
