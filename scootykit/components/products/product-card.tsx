import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Price } from "@/components/ui/price";
import { discountPercent, isOnSale } from "@/lib/commerce/pricing";
import type { ProductSummary } from "@/types";
import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "./wishlist-button";

export function ProductImageFallback({ label }: { label?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-surface to-slate-100 text-slate-400">
      <ImageOff className="h-8 w-8" aria-hidden="true" />
      {label && <span className="text-xs font-medium">{label}</span>}
    </div>
  );
}

export function ProductCard({ product, priority }: { product: ProductSummary; priority?: boolean }) {
  const href = `/product/${product.slug}`;
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 5;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-transparent hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-square overflow-hidden bg-surface">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
          {product.image ? (
            <Image
              src={product.image.url}
              alt={product.image.alt || product.name}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <ProductImageFallback />
          )}
        </Link>
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {isOnSale(product) && <span className="rounded-lg bg-coral-500 px-2 py-1 text-[11px] font-bold text-white">-{discountPercent(product)}%</span>}
          {soldOut && <span className="rounded-lg bg-navy-900 px-2 py-1 text-[11px] font-bold text-white">Sold out</span>}
        </div>
        <WishlistButton productId={product.id} productName={product.name} className="absolute right-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {product.category && (
          <Link href={`/category/${product.category.slug}`} className="mb-1 line-clamp-1 text-[11px] font-semibold uppercase tracking-wider text-muted hover:text-coral-600">
            {product.category.name}
          </Link>
        )}
        <h3 className="line-clamp-2 min-h-[2.6em] text-[14px] font-semibold leading-snug text-navy-900 sm:text-[15px]">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <Price price={product.price} salePrice={product.sale_price} size="sm" className="mt-2" />
        <p className={soldOut ? "mt-1 text-xs font-medium text-red-600" : lowStock ? "mt-1 text-xs font-medium text-amber-700" : "mt-1 text-xs font-medium text-emerald-700"}>
          {soldOut ? "Out of stock" : lowStock ? `Only ${product.stock} left` : "In stock"}
        </p>
        <div className="relative z-10 mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <AddToCartButton product={product} size="sm" className="w-full" />
          <Link
            href={href}
            className="hidden h-9 items-center justify-center rounded-xl border border-line px-3 text-sm font-semibold text-navy-900 transition-colors hover:bg-surface sm:inline-flex"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, className }: { products: ProductSummary[]; className?: string }) {
  return (
    <div className={className ?? "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4"}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="skeleton aspect-square rounded-none" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton mt-3 h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
