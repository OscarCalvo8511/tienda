import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Price } from "./price";
import { RatingStars } from "./rating-stars";
import { AddToCartButton } from "./add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { WishlistButton } from "./wishlist-button";
import { effectivePrice } from "@/lib/utils";
import type { ProductWithImage } from "@/features/products/types";
import { primaryImage } from "@/features/products/types";

export function ProductCard({ product }: { product: ProductWithImage }) {
  const image = primaryImage(product);
  const onSale = !!product.sale_price && product.sale_price < product.price;
  const isOut = product.status === "out_of_stock";
  const soon = product.status === "coming_soon";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      <Link
        href={`/producto/${product.slug}`}
        className="relative aspect-square overflow-hidden bg-muted"
      >
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-10" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {onSale && <Badge className="bg-sale text-sale-foreground">Oferta</Badge>}
          {soon && <Badge variant="secondary">Próximamente</Badge>}
          {isOut && <Badge variant="outline">Agotado</Badge>}
        </div>
      </Link>

      <div className="absolute right-2 top-2">
        <WishlistButton productId={product.id} />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {product.brand && (
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </span>
        )}
        <Link
          href={`/producto/${product.slug}`}
          className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
        >
          {product.name}
        </Link>
        {product.rating_count > 0 && (
          <RatingStars value={product.rating_avg} count={product.rating_count} />
        )}
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <Price price={product.price} salePrice={product.sale_price} size="sm" />
          <AddToCartButton
            size="sm"
            disabled={isOut || soon}
            label="Agregar"
            line={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              image,
              price: effectivePrice(product.price, product.sale_price),
              compareAt: onSale ? product.price : null,
            }}
          />
        </div>
      </div>
    </div>
  );
}
