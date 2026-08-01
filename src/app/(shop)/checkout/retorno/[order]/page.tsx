import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WompiReturn } from "@/components/shop/wompi-return";

export const metadata: Metadata = { title: "Confirmando pago" };

export default async function CheckoutReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ order: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { order } = await params;
  const { id } = await searchParams;
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <WompiReturn orderNumber={decodeURIComponent(order)} transactionId={id ?? null} />
    </div>
  );
}
