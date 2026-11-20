"use client";
import { useState } from "react";
import { useCart, MAX_PER_LINE } from "@/lib/client/cart-store";
import type { ProductSummary } from "@/types";
import { AddToCartButton } from "./add-to-cart-button";
import { QuantitySelector } from "./quantity-selector";
import { WishlistButton } from "./wishlist-button";

export function PurchasePanel({ product }: { product: ProductSummary }) {
  const lines = useCart();
  const inCart = lines.find((l) => l.productId === product.id)?.quantity ?? 0;
  const available = Math.max(Math.min(product.stock, MAX_PER_LINE) - inCart, 0);
  const [qty, setQty] = useState(1);
  const quantity = Math.min(qty, Math.max(available, 1));
  const soldOut = product.stock <= 0;

  return (
    <div className="space-y-3">
      {!soldOut && (
        <div className="flex flex-wrap items-center gap-3">
          <QuantitySelector value={quantity} max={Math.max(available, 1)} onChange={setQty} />
          {inCart > 0 && <span className="text-sm text-muted">{inCart} already in your cart</span>}
        </div>
      )}
      <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr_auto]">
        <AddToCartButton product={product} quantity={quantity} size="lg" className="h-12 w-full" />
        {!soldOut && <AddToCartButton product={product} quantity={quantity} size="lg" buyNow className="h-12 w-full" />}
        <WishlistButton productId={product.id} productName={product.name} withLabel />
      </div>
      {!soldOut && available === 0 && <p className="text-sm text-amber-700">You have the maximum available quantity in your cart.</p>}
    </div>
  );
}
