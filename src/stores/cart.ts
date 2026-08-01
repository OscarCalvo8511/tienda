"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  productId: string;
  variantId?: string | null;
  slug: string;
  name: string;
  image: string | null;
  /** Precio unitario efectivo (con oferta aplicada) en COP. */
  price: number;
  /** Precio normal, para mostrar tachado. */
  compareAt?: number | null;
  quantity: number;
  /** Stock disponible, para topar cantidades. */
  maxStock?: number;
}

interface CartState {
  items: CartLine[];
  addItem: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  setQuantity: (
    productId: string,
    quantity: number,
    variantId?: string | null,
  ) => void;
  clear: () => void;
  // selectores derivados
  totalItems: () => number;
  subtotal: () => number;
}

const sameLine = (a: CartLine, productId: string, variantId?: string | null) =>
  a.productId === productId && (a.variantId ?? null) === (variantId ?? null);

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (line, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) =>
            sameLine(i, line.productId, line.variantId),
          );
          if (existing) {
            const cap = existing.maxStock ?? Infinity;
            return {
              items: state.items.map((i) =>
                sameLine(i, line.productId, line.variantId)
                  ? { ...i, quantity: Math.min(cap, i.quantity + quantity) }
                  : i,
              ),
            };
          }
          return {
            items: [...state.items, { ...line, quantity: Math.max(1, quantity) }],
          };
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter((i) => !sameLine(i, productId, variantId)),
        })),

      setQuantity: (productId, quantity, variantId) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              sameLine(i, productId, variantId)
                ? {
                    ...i,
                    quantity: Math.max(
                      1,
                      Math.min(i.maxStock ?? Infinity, quantity),
                    ),
                  }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),

      clear: () => set({ items: [] }),

      totalItems: () => get().items.reduce((n, i) => n + i.quantity, 0),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
    }),
    { name: "tienda-cart" },
  ),
);
