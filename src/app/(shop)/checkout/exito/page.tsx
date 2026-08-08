import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Package } from "lucide-react";
import { getOrderByNumberPublic } from "@/features/orders/api";
import { getCurrentUser } from "@/features/auth/api";
import { Button } from "@/components/ui/button";
import { formatCOP, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Pedido confirmado" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;
  if (!orderNumber) notFound();

  const result = await getOrderByNumberPublic(orderNumber).catch(() => null);
  if (!result) notFound();
  const { order, items } = result;
  const user = await getCurrentUser().catch(() => null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border bg-card p-8 text-center">
        <Image
          src="/logo.jpg"
          alt="DyC local store"
          width={56}
          height={56}
          className="mx-auto mb-4 size-14 rounded-full"
        />
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-success/10">
          <CheckCircle2 className="size-9 text-success" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">¡Gracias por tu compra!</h1>
        <p className="mt-1 text-muted-foreground">
          Tu pedido <span className="font-semibold text-foreground">{order.order_number}</span> fue
          confirmado el {formatDate(order.created_at)}.
        </p>

        <div className="mt-6 divide-y rounded-xl border text-left">
          {items.map((it) => (
            <div key={it.id} className="flex justify-between gap-2 p-3 text-sm">
              <span>{it.quantity}× {it.product_name}</span>
              <span className="font-medium">{formatCOP(it.line_total)}</span>
            </div>
          ))}
        </div>

        <dl className="mt-4 space-y-1 text-left text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatCOP(order.subtotal)}</dd>
          </div>
          {order.discount_total > 0 && (
            <div className="flex justify-between text-success">
              <dt>Descuento</dt>
              <dd>−{formatCOP(order.discount_total)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Envío</dt>
            <dd>{order.shipping_total === 0 ? "Gratis" : formatCOP(order.shipping_total)}</dd>
          </div>
          <div className="flex justify-between border-t pt-1 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatCOP(order.total)}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {user && (
            <Button asChild>
              <Link href="/cuenta/pedidos">
                <Package className="size-4" /> Ver mis pedidos
              </Link>
            </Button>
          )}
          <Button asChild variant={user ? "outline" : "default"}>
            <Link href="/productos">Seguir comprando</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
