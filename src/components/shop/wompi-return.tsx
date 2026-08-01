"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, XCircle, Clock } from "lucide-react";
import { useCart } from "@/stores/cart";
import { useCouponStore } from "@/stores/coupon";
import { finalizeWompiReturnAction } from "@/features/orders/actions";
import { Button } from "@/components/ui/button";

type Phase = "checking" | "failed" | "pending";

const MAX_ATTEMPTS = 10;
const POLL_MS = 2500;

/**
 * Confirma el retorno desde Wompi. Consulta el estado (idempotente en servidor)
 * y, mientras el pago siga pendiente, reintenta unas veces por si el webhook
 * aún no llega. Al aprobarse, limpia el carrito y va a la página de éxito.
 */
export function WompiReturn({
  orderNumber,
  transactionId,
}: {
  orderNumber: string;
  transactionId: string | null;
}) {
  const router = useRouter();
  const clearCart = useCart((s) => s.clear);
  const clearCoupon = useCouponStore((s) => s.clearCoupon);
  const [phase, setPhase] = useState<Phase>("checking");
  const done = useRef(false);
  const attempts = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function check() {
      const { status } = await finalizeWompiReturnAction(orderNumber, transactionId);
      if (done.current) return;

      if (status === "paid") {
        done.current = true;
        clearCart();
        clearCoupon();
        router.replace(`/checkout/exito?order=${encodeURIComponent(orderNumber)}`);
        return;
      }
      if (status === "cancelled" || status === "returned" || status === "unknown") {
        done.current = true;
        setPhase("failed");
        return;
      }

      // pending: reintenta un número acotado de veces.
      attempts.current += 1;
      if (attempts.current >= MAX_ATTEMPTS) {
        setPhase("pending");
        return;
      }
      setPhase("checking");
      timer = setTimeout(check, POLL_MS);
    }

    check();
    return () => {
      done.current = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber, transactionId]);

  if (phase === "failed") {
    return (
      <Card
        icon={<XCircle className="size-9 text-destructive" />}
        iconBg="bg-destructive/10"
        title="No pudimos confirmar tu pago"
        body="El pago fue rechazado o cancelado. Tu pedido no se completó y no se hizo ningún cobro."
      >
        <Button asChild>
          <Link href="/carrito">Volver al carrito</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/cuenta/pedidos">Ver mis pedidos</Link>
        </Button>
      </Card>
    );
  }

  if (phase === "pending") {
    return (
      <Card
        icon={<Clock className="size-9 text-muted-foreground" />}
        iconBg="bg-muted"
        title="Estamos procesando tu pago"
        body="Algunos medios (como PSE) pueden tardar unos minutos. Te confirmaremos el pedido en cuanto se acredite; puedes revisar su estado en tus pedidos."
      >
        <Button asChild>
          <Link href="/cuenta/pedidos">Ver mis pedidos</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card
      icon={<Loader2 className="size-9 animate-spin text-brand" />}
      iconBg="bg-brand/10"
      title="Confirmando tu pago…"
      body="Un momento por favor. Estamos verificando la transacción con la pasarela."
    />
  );
}

function Card({
  icon,
  iconBg,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-8 text-center">
      <div className={`mx-auto grid size-16 place-items-center rounded-full ${iconBg}`}>
        {icon}
      </div>
      <h1 className="mt-4 text-xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      {children && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
