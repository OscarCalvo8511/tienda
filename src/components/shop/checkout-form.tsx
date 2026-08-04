"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/stores/cart";
import { useCouponStore } from "@/stores/coupon";
import { createCheckoutAction } from "@/features/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCOP } from "@/lib/utils";
import {
  COLOMBIA_DEPARTMENTS,
  COLOMBIA_CITIES,
  OTHER_CITY,
  type ColombiaDepartment,
} from "@/lib/colombia";

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
}

export function CheckoutForm({
  methods,
  freeThreshold,
  taxRate,
  taxIncluded,
  defaultEmail,
  defaultAddress,
  wompiEnabled,
}: {
  methods: ShippingMethod[];
  freeThreshold: number;
  taxRate: number;
  taxIncluded: boolean;
  defaultEmail: string;
  defaultAddress?: {
    full_name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    department: string;
  } | null;
  wompiEnabled: boolean;
}) {
  const router = useRouter();
  const { items, clear } = useCart();
  const { code, discount, clearCoupon } = useCouponStore();
  const [method, setMethod] = useState(methods[0]?.id ?? "standard");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Precarga de la dirección guardada (última compra). Si la ciudad guardada no
  // está en la lista del departamento, se muestra vía "Otra ciudad…".
  const savedDept = defaultAddress?.department ?? "";
  const savedCity = defaultAddress?.city ?? "";
  const savedDeptCities = savedDept
    ? COLOMBIA_CITIES[savedDept as ColombiaDepartment] ?? []
    : [];
  const savedCityInList = Boolean(savedCity) && savedDeptCities.includes(savedCity);

  const [department, setDepartment] = useState(savedDept);
  const [city, setCity] = useState(
    savedCityInList ? savedCity : savedCity ? OTHER_CITY : "",
  );
  const [otherCity, setOtherCity] = useState(savedCityInList ? "" : savedCity);
  const sortedDepartments = useMemo(
    () => [...COLOMBIA_DEPARTMENTS].sort((a, b) => a.localeCompare(b, "es")),
    [],
  );
  const cities = useMemo(
    () =>
      department
        ? Array.from(
            new Set(COLOMBIA_CITIES[department as ColombiaDepartment] ?? []),
          ).sort((a, b) => a.localeCompare(b, "es"))
        : [],
    [department],
  );
  const resolvedCity = city === OTHER_CITY ? otherCity.trim() : city;

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items],
  );
  const effectiveDiscount = code ? Math.min(discount, subtotal) : 0;
  const discounted = subtotal - effectiveDiscount;
  const selectedMethod = methods.find((m) => m.id === method);
  const freeShipping = freeThreshold > 0 && discounted >= freeThreshold;
  const shipping = freeShipping ? 0 : selectedMethod?.price ?? 0;
  const tax = taxIncluded
    ? Math.round(discounted - discounted / (1 + taxRate))
    : Math.round(discounted * taxRate);
  const total = taxIncluded ? discounted + shipping : discounted + shipping + tax;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }
    if (!department) {
      toast.error("Selecciona el departamento");
      return;
    }
    if (!resolvedCity) {
      toast.error("Selecciona o escribe la ciudad");
      return;
    }
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    const res = await createCheckoutAction({
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId ?? null,
        quantity: i.quantity,
      })),
      customer: {
        email: String(fd.get("email")),
        phone: String(fd.get("phone")),
      },
      shippingMethodId: method,
      address: {
        full_name: String(fd.get("full_name")),
        line1: String(fd.get("line1")),
        line2: String(fd.get("line2") ?? ""),
        city: resolvedCity,
        department,
        country: "Colombia",
      },
      couponCode: code,
      notes: String(fd.get("notes") ?? ""),
    });
    if (res.ok) {
      if (res.external) {
        // Redirige a la pasarela (Wompi). El carrito se limpia al confirmar
        // el pago, en la página de retorno.
        window.location.assign(res.redirect);
        return;
      }
      clear();
      clearCoupon();
      router.push(res.redirect);
    } else {
      setSubmitting(false);
      toast.error(res.error);
    }
  }

  if (mounted && items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">Tu carrito está vacío.</p>
        <Button asChild className="mt-4">
          <Link href="/productos">Ver productos</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        {/* Contacto */}
        <section className="space-y-4 rounded-xl border p-5">
          <h2 className="font-semibold">Datos de contacto</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Correo" name="email" type="email" required defaultValue={defaultEmail} />
            <Field label="Teléfono" name="phone" type="tel" required placeholder="300 000 0000" defaultValue={defaultAddress?.phone} />
          </div>
        </section>

        {/* Envío */}
        <section className="space-y-4 rounded-xl border p-5">
          <h2 className="font-semibold">Dirección de envío</h2>
          <Field label="Nombre completo" name="full_name" required defaultValue={defaultAddress?.full_name} />
          <Field label="Dirección" name="line1" required placeholder="Calle 00 # 00-00" defaultValue={defaultAddress?.line1} />
          <Field label="Complemento (opcional)" name="line2" placeholder="Apto, torre, indicaciones" defaultValue={defaultAddress?.line2 ?? undefined} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="department">Departamento</Label>
              <select
                id="department"
                name="department"
                required
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setCity("");
                  setOtherCity("");
                }}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="" disabled>Selecciona…</option>
                {sortedDepartments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Ciudad</Label>
              <select
                id="city"
                required
                disabled={!department}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>
                  {department ? "Selecciona…" : "Elige un departamento primero"}
                </option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value={OTHER_CITY}>Otra ciudad…</option>
              </select>
            </div>
          </div>
          {city === OTHER_CITY && (
            <div className="space-y-1.5">
              <Label htmlFor="city_other">Escribe tu ciudad</Label>
              <Input
                id="city_other"
                required
                value={otherCity}
                onChange={(e) => setOtherCity(e.target.value)}
                placeholder="Nombre del municipio"
              />
            </div>
          )}
          <Field label="País" name="country" defaultValue="Colombia" disabled />
        </section>

        {/* Método de envío */}
        <section className="space-y-3 rounded-xl border p-5">
          <h2 className="font-semibold">Método de envío</h2>
          {methods.map((m) => (
            <label
              key={m.id}
              className="flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm has-[:checked]:border-brand has-[:checked]:bg-accent"
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shipping_method"
                  checked={method === m.id}
                  onChange={() => setMethod(m.id)}
                />
                {m.name}
              </span>
              <span className="font-medium">
                {freeShipping ? "Gratis" : formatCOP(m.price)}
              </span>
            </label>
          ))}
        </section>

        {/* Pago */}
        <section className="space-y-3 rounded-xl border p-5">
          <h2 className="font-semibold">Método de pago</h2>
          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <Lock className="size-4" /> Pago seguro
            </p>
            {wompiEnabled ? (
              <p className="mt-1">
                Al continuar te llevaremos a la página segura de{" "}
                <strong>Wompi</strong> para pagar con PSE, Nequi, tarjeta o
                Bancolombia. Tu pedido se confirma al aprobarse el pago.
              </p>
            ) : (
              <p className="mt-1">
                En modo demo el pago se simula y el pedido queda como{" "}
                <strong>pagado</strong>. Al configurar Wompi, aquí se abrirá la
                pasarela real.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Resumen */}
      <div className="h-fit space-y-4 rounded-xl border p-5">
        <h2 className="font-semibold">Tu pedido</h2>
        <ul className="max-h-64 space-y-3 overflow-auto text-sm">
          {mounted &&
            items.map((i) => (
              <li key={`${i.productId}-${i.variantId ?? ""}`} className="flex justify-between gap-2">
                <span className="text-muted-foreground">
                  {i.quantity}× {i.name}
                </span>
                <span className="shrink-0">{formatCOP(i.price * i.quantity)}</span>
              </li>
            ))}
        </ul>
        <dl className="space-y-2 border-t pt-3 text-sm">
          <Row label="Subtotal" value={formatCOP(subtotal)} />
          {effectiveDiscount > 0 && (
            <Row label={`Descuento (${code})`} value={`−${formatCOP(effectiveDiscount)}`} accent />
          )}
          <Row label="Envío" value={freeShipping ? "Gratis" : formatCOP(shipping)} />
          <Row label={taxIncluded ? "IVA incluido" : "IVA"} value={formatCOP(tax)} muted />
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatCOP(total)}</dd>
          </div>
        </dl>
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Pagar {formatCOP(total)}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}

function Row({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${accent ? "text-success" : muted ? "text-muted-foreground" : ""}`}
    >
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
