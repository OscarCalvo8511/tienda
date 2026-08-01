"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CouponState {
  code: string | null;
  discount: number;
  setCoupon: (code: string, discount: number) => void;
  clearCoupon: () => void;
}

export const useCouponStore = create<CouponState>()(
  persist(
    (set) => ({
      code: null,
      discount: 0,
      setCoupon: (code, discount) => set({ code, discount }),
      clearCoupon: () => set({ code: null, discount: 0 }),
    }),
    { name: "tienda-coupon" },
  ),
);
