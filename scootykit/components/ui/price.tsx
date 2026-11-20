import { formatPKR } from "@/lib/commerce/format";
import { discountPercent, effectivePrice, isOnSale } from "@/lib/commerce/pricing";
import { cn } from "@/lib/utils";

export function Price({
  price,
  salePrice,
  size = "md",
  showBadge = false,
  className,
}: {
  price: number;
  salePrice: number | null;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  className?: string;
}) {
  const p = { price, sale_price: salePrice };
  const onSale = isOnSale(p);
  const sizes = { sm: "text-[15px]", md: "text-lg", lg: "text-3xl" };
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn("font-display font-extrabold text-navy-900", sizes[size])}>{formatPKR(effectivePrice(p))}</span>
      {onSale && (
        <>
          <span className={cn("text-muted line-through", size === "lg" ? "text-lg" : "text-sm")}>
            <span className="sr-only">Regular price </span>
            {formatPKR(price)}
          </span>
          {showBadge && (
            <span className="rounded-md bg-coral-50 px-1.5 py-0.5 text-xs font-bold text-coral-700">-{discountPercent(p)}%</span>
          )}
        </>
      )}
    </div>
  );
}
