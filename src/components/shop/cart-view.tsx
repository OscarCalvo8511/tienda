"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { Minus, Plus, Trash2, ShoppingBag, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCOP } from "@/lib/utils";
import { validateCouponAction } from "@/features/orders/actions";
import { useCouponStore } from "@/stores/coupon";

export function CartView({
  freeThreshold,
  taxRate,
  taxIncluded,
}: {
  freeThreshold: number;
  taxRate: number;
  taxIncluded: boolean;
}) {
  const { items, setQuantity, removeItem } = useCart();
  const { code, discount, setCoupon, clearCoupon } = useCouponStore();
  const [couponInput, setCouponInput] = useState(code ?? "");
  const [checking, setChecking] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items],
  );

  const effectiveDiscount = code ? Math.min(discount, subtotal) : 0;
  const discounted = subtotal - effectiveDiscount;
  const freeShipping = freeThreshold > 0 && discounted >= freeThreshold;
  const tax = taxIncluded
    ? Math.round(discounted - discounted / (1 + taxRate))
    : Math.round(discounted * taxRate);
  const total = taxIncluded ? discounted : discounted + tax;

  async function applyCoupon() {
    setChecking(true);
    const res = await validateCouponAction(couponInput, subtotal);
    setChecking(false);
    if (res.valid) {
      setCoupon(res.code, res.discount);
      toast.success(`Cupón aplicado: ${res.label}`);
    } else {
      clearCoupon();
      toast.error(res.message);
    }
  }

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
        <ShoppingBag className="size-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Tu carrito está vacío</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Agrega productos para comenzar tu compra.
        </p>
        <Button asChild className="mt-6">
          <Link href="/productos">Ver productos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* Líneas */}
      <div className="divide-y rounded-xl border">
        {items.map((item) => (
          <div key={`${item.productId}-${item.variantId ?? ""}`} className="flex gap-4 p-4">
            <Link
              href={`/producto/${item.slug}`}
              className="relative size-20 shrink-0 overflow-hidden rounded-lg border bg-muted"
            >
              {item.image && (
                <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
              )}
            </Link>
            <div className="flex flex-1 flex-col">
              <Link href={`/producto/${item.slug}`} className="text-sm font-medium hover:underline">
                {item.name}
              </Link>
              <span className="mt-1 text-sm text-muted-foreground">
                {formatCOP(item.price)}
              </span>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center rounded-md border">
                  <button
                    className="grid size-8 place-items-center hover:bg-accent"
                    onClick={() => setQuantity(item.productId, item.quantity - 1, item.variantId)}
                    aria-label="Disminuir"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    className="grid size-8 place-items-center hover:bg-accent"
                    onClick={() => setQuantity(item.productId, item.quantity + 1, item.variantId)}
                    aria-label="Aumentar"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(item.productId, item.variantId)}
                >
                  <Trash2 className="size-3.5" /> Quitar
                </button>
              </div>
            </div>
            <div className="text-right text-sm font-semibold">
              {formatCOP(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="h-fit space-y-4 rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Resumen</h2>

        <div className="flex gap-2">
          <Input
            placeholder="Código de cupón"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
          />
          <Button variant="outline" onClick={applyCoupon} disabled={checking}>
            {checking ? <Loader2 className="size-4 animate-spin" /> : <Tag className="size-4" />}
            Aplicar
          </Button>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatCOP(subtotal)}</dd>
          </div>
          {effectiveDiscount > 0 && (
            <div className="flex justify-between text-success">
              <dt>Descuento ({code})</dt>
              <dd>−{formatCOP(effectiveDiscount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Envío</dt>
            <dd>{freeShipping ? "Gratis" : "Se calcula en el pago"}</dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>{taxIncluded ? "IVA incluido" : "IVA"}</dt>
            <dd>{formatCOP(tax)}</dd>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatCOP(total)}</dd>
          </div>
        </dl>

        <Button asChild size="lg" className="w-full">
          <Link href="/checkout">Continuar al pago</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/productos">Seguir comprando</Link>
        </Button>
      </div>
    </div>
  );
}
