import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases de Tailwind resolviendo conflictos. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea un valor numérico (en pesos) como moneda colombiana. */
export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Formatea una fecha en español (Colombia). */
export function formatDate(
  date: string | number | Date,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  return new Intl.DateTimeFormat("es-CO", opts).format(new Date(date));
}

/** Calcula el porcentaje de descuento entre precio normal y de oferta. */
export function discountPercent(price: number, salePrice?: number | null): number {
  if (!salePrice || salePrice >= price || price <= 0) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

/** Genera un slug URL-safe a partir de un texto. */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Precio efectivo de un producto (oferta si aplica). */
export function effectivePrice(price: number, salePrice?: number | null): number {
  return salePrice && salePrice > 0 && salePrice < price ? salePrice : price;
}
