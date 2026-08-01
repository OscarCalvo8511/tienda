import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck, ShieldCheck, CreditCard, Undo2 } from "lucide-react";
import {
  getCarouselProducts,
  getFeaturedProducts,
  getNewProducts,
  getSaleProducts,
} from "@/features/products/api";
import { getCategoryTree } from "@/features/categories/api";
import { ProductGrid } from "@/components/shop/product-grid";
import { HeroCarousel } from "@/components/shop/hero-carousel";
import { Button } from "@/components/ui/button";

export const revalidate = 60;

export default async function HomePage() {
  const [carrusel, featured, nuevos, ofertas, categorias] = await Promise.all([
    getCarouselProducts(8).catch(() => []),
    getFeaturedProducts(8).catch(() => []),
    getNewProducts(8).catch(() => []),
    getSaleProducts(8).catch(() => []),
    getCategoryTree().catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Carrusel de destacados de la semana + ofertas */}
      {carrusel.length > 0 && <HeroCarousel products={carrusel} />}

      {/* Hero (respaldo cuando no hay productos en el carrusel) */}
      {carrusel.length === 0 && (
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="grid items-center gap-6 p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
              Envío gratis desde $200.000
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Tecnología y moda al mejor precio
            </h1>
            <p className="mt-4 max-w-md text-primary-foreground/80">
              Descubre miles de productos con ofertas todos los días. Compra
              seguro y recibe en toda Colombia.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/productos">
                  Ver catálogo <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href="/productos?oferta=1">Ver ofertas</Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden aspect-[4/3] lg:block">
            <Image
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80"
              alt="Compras en línea"
              fill
              priority
              sizes="(max-width: 1024px) 0px, 40vw"
              className="rounded-xl object-cover"
            />
          </div>
        </div>
      </section>
      )}

      {/* Beneficios */}
      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Truck, title: "Envío rápido", desc: "A todo el país" },
          { icon: ShieldCheck, title: "Compra segura", desc: "Datos protegidos" },
          { icon: CreditCard, title: "Pago fácil", desc: "Tarjeta y más" },
          { icon: Undo2, title: "Devoluciones", desc: "Hasta 30 días" },
        ].map((b) => (
          <div
            key={b.title}
            className="flex items-center gap-3 rounded-xl border bg-card p-4"
          >
            <b.icon className="size-6 text-brand" />
            <div>
              <p className="text-sm font-semibold">{b.title}</p>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categorías */}
      {categorias.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Explora por categoría</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categorias.map((c) => (
              <Link
                key={c.id}
                href={`/productos?categoria=${c.slug}`}
                className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-5 text-center transition hover:border-brand hover:shadow-sm"
              >
                <span className="grid size-12 place-items-center rounded-full bg-accent text-lg font-bold text-brand">
                  {c.name.charAt(0)}
                </span>
                <span className="text-sm font-medium">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <HomeSection
        title="Ofertas de la semana"
        href="/productos?oferta=1"
        products={ofertas}
      />
      <HomeSection
        title="Productos destacados"
        href="/productos"
        products={featured}
      />
      <HomeSection title="Recién llegados" href="/productos" products={nuevos} />
    </div>
  );
}

function HomeSection({
  title,
  href,
  products,
}: {
  title: string;
  href: string;
  products: Awaited<ReturnType<typeof getFeaturedProducts>>;
}) {
  if (!products.length) return null;
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          Ver todo <ArrowRight className="size-4" />
        </Link>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}
