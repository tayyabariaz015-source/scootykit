"use client";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/client/wishlist-store";
import { toggleWishlist } from "@/lib/client/wishlist-actions";
import { toast } from "@/lib/client/toast-store";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, productName, className, withLabel }: { productId: string; productName: string; className?: string; withLabel?: boolean }) {
  const ids = useWishlist();
  const active = ids.includes(productId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggleWishlist(productId);
        toast({
          title: added ? "Saved to wishlist" : "Removed from wishlist",
          description: productName,
          tone: "info",
          action: added ? { label: "View wishlist", href: "/wishlist" } : undefined,
        });
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-colors",
        withLabel
          ? "h-12 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface"
          : "h-9 w-9 rounded-full bg-white/95 shadow-sm ring-1 ring-line backdrop-blur hover:text-coral-600",
        active ? "text-coral-600" : "text-navy-800",
        className,
      )}
    >
      <Heart className={cn("h-4.5 w-4.5", active && "fill-current")} />
      {withLabel && (active ? "Saved" : "Wishlist")}
    </button>
  );
}
