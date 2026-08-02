"use client";

import { Truck } from "lucide-react";
import { formatCOP } from "@/lib/utils";

/**
 * Barra superior con un mensaje de envío gratis que se desplaza en bucle
 * continuo (marquee). El umbral viene de la configuración de la tienda.
 */
export function AnnouncementBar({ threshold }: { threshold: number }) {
  if (!threshold || threshold <= 0) return null;

  const text = `Envío GRATIS en compras desde ${formatCOP(threshold)}`;

  // Cada "grupo" repite el mensaje para llenar el ancho; renderizamos el grupo
  // dos veces y desplazamos -50% para lograr un bucle sin cortes.
  const group = (
    <div className="flex shrink-0" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          className="mx-6 inline-flex items-center gap-2 text-xs font-semibold tracking-wide sm:text-sm"
        >
          <Truck className="size-4" />
          {text}
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden bg-brand text-brand-foreground">
      {/* Texto accesible para lectores de pantalla (el marquee está oculto). */}
      <span className="sr-only">{text}</span>
      <div className="marquee-track flex w-max py-2">
        {group}
        {group}
      </div>
    </div>
  );
}
