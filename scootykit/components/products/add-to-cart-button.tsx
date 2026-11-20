"use client";
import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { addToCart, useCart } from "@/lib/client/cart-store";
import { toast } from "@/lib/client/toast-store";
import { Button } from "@/components/ui/button";
import type { ProductSummary } from "@/types";

export function toCartItem(p: ProductSummary) {
  return {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    salePrice: p.sale_price,
    image: p.image?.url ?? null,
    stock: p.stock,
  };
}

export function AddToCartButton({
  product,
  quantity = 1,
  size = "md",
  className,
  buyNow,
  label,
}: {
  product: ProductSummary;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  buyNow?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const lines = useCart();
  const inCart = lines.find((l) => l.productId === product.id)?.quantity ?? 0;
  const soldOut = product.stock <= 0;
  const maxed = !soldOut && inCart >= Math.min(product.stock, 50);

  function handle() {
    if (buyNow && inCart > 0) {
      router.push("/checkout");
      return;
    }
    const { added, capped } = addToCart(toCartItem(product), quantity);
    if (added === 0) {
      toast({ title: "Maximum quantity reached", description: `Only ${product.stock} available.`, tone: "error" });
      return;
    }
    if (buyNow) {
      router.push("/checkout");
      return;
    }
    toast({
      title: capped ? `Added ${added} (stock limit reached)` : "Added to cart",
      description: product.name,
      action: { label: "View cart", href: "/cart" },
    });
  }

  if (soldOut) {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        Out of stock
      </Button>
    );
  }
  return (
    <Button variant={buyNow ? "secondary" : "primary"} size={size} onClick={handle} disabled={maxed && !buyNow} className={className}>
      {!buyNow && <ShoppingBag className="h-4 w-4" />}
      {label ?? (buyNow ? "Buy Now" : maxed ? "Max in cart" : "Add to Cart")}
    </Button>
  );
}
