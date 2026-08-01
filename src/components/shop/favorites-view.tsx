"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { useFavorites } from "@/stores/favorites";
import { getFavoriteProductsAction } from "@/features/account/actions";
import { ProductGrid } from "@/components/shop/product-grid";
import { Button } from "@/components/ui/button";
import type { ProductWithImage } from "@/features/products/types";

export function FavoritesView() {
  const ids = useFavorites((s) => s.ids);
  const [products, setProducts] = useState<ProductWithImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getFavoriteProductsAction(ids).then((res) => {
      if (active) {
        setProducts(res);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [ids]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center">
        <Heart className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          No tienes productos favoritos.
        </p>
        <Button asChild className="mt-4">
          <Link href="/productos">Explorar productos</Link>
        </Button>
      </div>
    );
  }

  return <ProductGrid products={products} className="sm:grid-cols-2 lg:grid-cols-3" />;
}
