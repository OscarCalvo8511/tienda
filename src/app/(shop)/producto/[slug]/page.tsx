import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Truck, ShieldCheck } from "lucide-react";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/features/products/api";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { ProductGrid } from "@/components/shop/product-grid";
import { Price } from "@/components/shop/price";
import { RatingStars } from "@/components/shop/rating-stars";
import { ReviewSection } from "@/components/shop/review-section";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { effectivePrice } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: product.name,
    description: product.short_description ?? undefined,
    openGraph: { images: product.product_images?.[0]?.url ? [product.product_images[0].url] : [] },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) notFound();

  const related = await getRelatedProducts(
    product.category_id,
    product.id,
    4,
  ).catch(() => []);

  const stock = product.inventory?.[0]?.quantity ?? 0;
  const isOut = product.status === "out_of_stock" || stock <= 0;
  const soon = product.status === "coming_soon";
  const image = product.product_images?.find((i) => i.is_primary)?.url ??
    product.product_images?.[0]?.url ?? null;
  const specs = (product.specifications ?? {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Inicio</Link>
        <span>/</span>
        <Link href="/productos" className="hover:text-foreground">Productos</Link>
        {product.categories && (
          <>
            <span>/</span>
            <Link
              href={`/productos?categoria=${product.categories.slug}`}
              className="hover:text-foreground"
            >
              {product.categories.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery
          images={(product.product_images ?? []).map((i) => ({ url: i.url, alt: i.alt }))}
          name={product.name}
        />

        <div>
          {product.brand && (
            <span className="text-sm uppercase tracking-wide text-muted-foreground">
              {product.brand}
            </span>
          )}
          <div className="mt-1 flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold sm:text-3xl">{product.name}</h1>
            <WishlistButton productId={product.id} className="size-10" />
          </div>

          {product.rating_count > 0 && (
            <div className="mt-2">
              <RatingStars value={product.rating_avg} count={product.rating_count} />
            </div>
          )}

          <div className="mt-4">
            <Price price={product.price} salePrice={product.sale_price} size="lg" />
          </div>

          <div className="mt-3">
            {isOut ? (
              <Badge variant="outline">Agotado</Badge>
            ) : soon ? (
              <Badge variant="secondary">Próximamente</Badge>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                <Check className="size-4" /> Disponible
              </span>
            )}
          </div>

          {product.short_description && (
            <p className="mt-4 text-muted-foreground">{product.short_description}</p>
          )}

          <Separator className="my-6" />

          <ProductPurchase
            maxStock={stock}
            disabled={isOut || soon}
            line={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              image,
              price: effectivePrice(product.price, product.sale_price),
              compareAt: product.sale_price ? product.price : null,
              maxStock: stock,
            }}
          />

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Truck className="size-5 text-brand" />
              <span>Envío a todo el país</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <ShieldCheck className="size-5 text-brand" />
              <span>Compra protegida</span>
            </div>
          </div>
        </div>
      </div>

      {/* Descripción y especificaciones */}
      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        {product.description && (
          <section>
            <h2 className="mb-3 text-lg font-bold">Descripción</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </section>
        )}
        {Object.keys(specs).length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold">Especificaciones</h2>
            <dl className="overflow-hidden rounded-xl border">
              {Object.entries(specs).map(([k, v], i) => (
                <div
                  key={k}
                  className={i % 2 ? "flex gap-4 bg-muted/40 px-4 py-2.5" : "flex gap-4 px-4 py-2.5"}
                >
                  <dt className="w-1/3 text-sm font-medium">{k}</dt>
                  <dd className="flex-1 text-sm text-muted-foreground">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      {/* Reseñas */}
      <ReviewSection
        productId={product.id}
        slug={product.slug}
        ratingAvg={product.rating_avg}
        ratingCount={product.rating_count}
      />

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold">Productos relacionados</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
