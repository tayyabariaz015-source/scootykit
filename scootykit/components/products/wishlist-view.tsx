"use client";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { getCartProducts } from "@/lib/actions/cart";
import { useWishlist, wishlistStore } from "@/lib/client/wishlist-store";
import { useSignedIn } from "@/lib/client/session";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import type { ProductSummary } from "@/types";
import { ProductGrid, ProductGridSkeleton } from "./product-card";

export function WishlistView() {
  const ids = useWishlist();
  const hydrated = wishlistStore.useHydrated();
  const signedIn = useSignedIn();
  const [products, setProducts] = useState<ProductSummary[] | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const current = key ? key.split(",") : [];
    (current.length ? getCartProducts(current) : Promise.resolve([])).then((ps) => {
      if (cancelled) return;
      const order = new Map(current.map((id, i) => [id, i]));
      setProducts([...ps].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)));
    });
    return () => {
      cancelled = true;
    };
  }, [key, hydrated]);

  if (!hydrated || products === null) return <ProductGridSkeleton count={4} />;
  const visible = products.filter((p) => ids.includes(p.id));
  if (visible.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Your wishlist is empty"
        description={signedIn ? "Tap the heart on any product to save it here." : "Tap the heart on any product to save it. Sign in to keep your wishlist across devices."}
        action={<ButtonLink href="/shop">Browse products</ButtonLink>}
      />
    );
  }
  return <ProductGrid products={visible} />;
}
