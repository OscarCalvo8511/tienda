import type { Coupon } from "@/types/database.types";

export interface PriceableItem {
  price: number; // precio unitario efectivo
  quantity: number;
}

/** Descuento que aplica un cupón sobre un subtotal. */
export function couponDiscount(
  coupon: Coupon | null,
  subtotal: number,
): number {
  if (!coupon) return 0;
  if (subtotal < coupon.min_purchase) return 0;
  switch (coupon.type) {
    case "percentage":
      return Math.round((subtotal * coupon.value) / 100);
    case "fixed":
      return Math.min(subtotal, Math.round(coupon.value));
    case "free_shipping":
      return 0; // se aplica sobre el envío, no el subtotal
  }
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

/** Id del método de envío estándar (el que queda gratis al superar el umbral). */
export const STANDARD_METHOD_ID = "standard";

/**
 * Cuando aplica el envío gratis (por umbral o cupón), el envío estándar queda
 * en $0 pero el envío más rápido (express) mantiene este costo reducido.
 */
export const EXPRESS_FEE_ON_FREE_SHIPPING = 7000;

export function computeTotals(params: {
  items: PriceableItem[];
  coupon: Coupon | null;
  shippingCost: number;
  shippingMethodId: string;
  freeShippingThreshold: number;
  taxRate: number;
  taxIncluded: boolean;
}): OrderTotals {
  const {
    items,
    coupon,
    shippingCost,
    shippingMethodId,
    freeShippingThreshold,
    taxRate,
    taxIncluded,
  } = params;

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = couponDiscount(coupon, subtotal);
  const discounted = Math.max(0, subtotal - discount);

  const freeByThreshold =
    freeShippingThreshold > 0 && discounted >= freeShippingThreshold;
  const freeByCoupon = coupon?.type === "free_shipping" && subtotal >= (coupon?.min_purchase ?? 0);
  const freeShipping = freeByThreshold || freeByCoupon;
  // Envío gratis: el estándar queda en $0; el express mantiene el costo reducido.
  const shipping = freeShipping
    ? shippingMethodId === STANDARD_METHOD_ID
      ? 0
      : EXPRESS_FEE_ON_FREE_SHIPPING
    : shippingCost;

  // IVA incluido en el precio: solo informativo; no se suma al total.
  const tax = taxIncluded
    ? Math.round(discounted - discounted / (1 + taxRate))
    : Math.round(discounted * taxRate);

  const total = taxIncluded ? discounted + shipping : discounted + shipping + tax;

  return { subtotal, discount, shipping, tax, total };
}
