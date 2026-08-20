"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/stores/cart";

/** Identificador anónimo estable del visitante (guardado en el dispositivo). */
function getSessionId(): string {
  try {
    let id = localStorage.getItem("dyc_sid");
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now()) + Math.random().toString(36).slice(2);
      localStorage.setItem("dyc_sid", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function send(body: Record<string, unknown>) {
  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignorar
  }
}

/**
 * Registra analítica anónima: una vista por navegación, un latido de presencia
 * cada 25s y el estado del carrito cuando cambia. No renderiza nada.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const sid = useRef<string>("");
  if (!sid.current && typeof window !== "undefined") {
    sid.current = getSessionId();
  }

  // Vista al cambiar de ruta.
  useEffect(() => {
    if (!sid.current) return;
    send({ type: "view", session: sid.current, path: pathname });
  }, [pathname]);

  // Latido de presencia.
  useEffect(() => {
    if (!sid.current) return;
    const t = setInterval(
      () => send({ type: "ping", session: sid.current }),
      25000,
    );
    return () => clearInterval(t);
  }, []);

  // Estado del carrito cuando cambia.
  useEffect(() => {
    if (!sid.current) return;
    const unsub = useCart.subscribe((state) => {
      const items = state.items.reduce((s, i) => s + i.quantity, 0);
      const value = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
      send({ type: "cart", session: sid.current, items, value });
    });
    return () => unsub();
  }, []);

  return null;
}
