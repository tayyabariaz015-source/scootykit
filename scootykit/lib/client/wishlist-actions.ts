"use client";
import { setWishlisted } from "@/lib/actions/wishlist";
import { isSignedIn } from "./session";
import { wishlistStore } from "./wishlist-store";

export function toggleWishlist(productId: string): boolean {
  const next = !wishlistStore.get().includes(productId);
  wishlistStore.set((ids) => (next ? [productId, ...ids.filter((i) => i !== productId)] : ids.filter((i) => i !== productId)));
  if (isSignedIn()) {
    setWishlisted(productId, next).catch(() => undefined);
  }
  return next;
}
