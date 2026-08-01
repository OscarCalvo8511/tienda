"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { primaryImage, type ProductWithImage } from "@/features/products/types";
import { Button } from "@/components/ui/button";
import { formatCOP, effectivePrice, cn } from "@/lib/utils";

const ROTATE_MS = 5000;

export function HeroCarousel({ products }: { products: ProductWithImage[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = products.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (count <= 1 || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(t);
  }, [count, paused]);

  if (count === 0) return null;

  return (
    <section
      className="relative overflow-hidden rounded-2xl bg-muted"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrusel"
    >
      <div className="relative aspect-[16/9] sm:aspect-[21/9]">
        {products.map((p, i) => {
          const img = primaryImage(p);
          const price = effectivePrice(Number(p.price), p.sale_price ?? null);
          const onSale = p.sale_price != null;
          return (
            <div
              key={p.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-700",
                i === index ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              aria-hidden={i !== index}
            >
              {img && (
                <Image
                  src={img}
                  alt={p.name}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 text-white sm:p-12">
                {onSale && (
                  <span className="w-fit rounded-full bg-brand px-3 py-1 text-xs font-semibold">
                    Oferta de la semana
                  </span>
                )}
                {!onSale && p.is_carousel && (
                  <span className="w-fit rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                    Destacado de la semana
                  </span>
                )}
                <h2 className="max-w-lg text-2xl font-bold leading-tight sm:text-4xl">
                  {p.name}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold sm:text-3xl">
                    {formatCOP(price)}
                  </span>
                  {onSale && (
                    <span className="text-base text-white/60 line-through">
                      {formatCOP(Number(p.price))}
                    </span>
                  )}
                </div>
                <Button asChild size="lg" variant="secondary" className="w-fit">
                  <Link href={`/producto/${p.slug}`}>
                    Ver producto <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Anterior"
            className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Siguiente"
            className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {products.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ir a la diapositiva ${i + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
