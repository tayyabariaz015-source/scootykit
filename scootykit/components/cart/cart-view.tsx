"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, ShieldCheck, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { getCheckoutQuote } from "@/lib/actions/checkout";
import { cartStore, removeFromCart, setQuantity, useCart, MAX_PER_LINE } from "@/lib/client/cart-store";
import { couponStore } from "@/lib/client/coupon-store";
import { formatPKR } from "@/lib/commerce/format";
import { cartSubtotal, effectivePrice } from "@/lib/commerce/pricing";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Alert, EmptyState } from "@/components/ui/misc";
import { ProductImageFallback } from "@/components/products/product-card";
import { QuantitySelector } from "@/components/products/quantity-selector";
import { useFreshCart } from "./use-fresh-cart";

export function CartView({ estimatedDelivery, freeThreshold }: { estimatedDelivery: number | null; freeThreshold: number | null }) {
  const lines = useCart();
  const hydrated = cartStore.useHydrated();
  const { notices, refreshing } = useFreshCart();
  const coupon = couponStore.useStore();

  const subtotal = cartSubtotal(lines.map((l) => ({ price: l.price, sale_price: l.salePrice, quantity: l.quantity })));
  const delivery = estimatedDelivery === null ? null : freeThreshold !== null && subtotal >= freeThreshold ? 0 : estimatedDelivery;

  const [discount, setDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checking, startCheck] = useTransition();
  const [couponInput, setCouponInput] = useState("");

  const itemsKey = lines.map((l) => `${l.productId}:${l.quantity}`).join("|");
  useEffect(() => {
    if (!coupon || lines.length === 0) return;
    let cancelled = false;
    getCheckoutQuote({ items: lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })), couponCode: coupon }).then((q) => {
      if (cancelled || !q) return;
      if (q.couponCode) {
        setDiscount({ code: q.couponCode, amount: q.discount });
        setCouponError(null);
      } else {
        setDiscount(null);
        setCouponError(q.couponError);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupon, itemsKey]);

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    startCheck(async () => {
      const q = await getCheckoutQuote({ items: lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })), couponCode: code });
      if (!q) {
        setCouponError("Coupons aren't available right now.");
      } else if (q.couponCode) {
        couponStore.set(q.couponCode);
        setDiscount({ code: q.couponCode, amount: q.discount });
        setCouponError(null);
        setCouponInput("");
      } else {
        setCouponError(q.couponError ?? "That coupon isn't valid.");
      }
    });
  }

  function removeCoupon() {
    couponStore.set("");
    setDiscount(null);
    setCouponError(null);
  }

  if (!hydrated) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]" aria-busy="true">
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description={notices.length ? notices.join(" ") : "Browse our accessories and add something for your ride."}
        action={<ButtonLink href="/shop">Start shopping</ButtonLink>}
      />
    );
  }

  const appliedDiscount = discount && coupon ? Math.min(discount.amount, subtotal) : 0;
  const total = Math.max(subtotal - appliedDiscount + (delivery ?? 0), 0);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        {notices.length > 0 && (
          <Alert tone="warning" title="Your cart was updated" className="mb-4">
            <ul className="list-disc pl-4">
              {notices.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </Alert>
        )}
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white" aria-label="Cart items">
          {lines.map((l) => {
            const unit = effectivePrice({ price: l.price, sale_price: l.salePrice });
            return (
              <li key={l.productId} className="flex gap-4 p-4 sm:p-5">
                <Link href={`/product/${l.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface sm:h-28 sm:w-28">
                  {l.image ? <Image src={l.image} alt={l.name} fill sizes="112px" className="object-cover" /> : <ProductImageFallback />}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/product/${l.slug}`} className="line-clamp-2 text-[15px] font-semibold hover:text-coral-600">
                      {l.name}
                    </Link>
                    <button onClick={() => removeFromCart(l.productId)} className="-mr-1 -mt-1 rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${l.name}`}>
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {formatPKR(unit)} each
                    {l.salePrice !== null && l.salePrice < l.price && <span className="ml-1.5 line-through">{formatPKR(l.price)}</span>}
                  </p>
                  {l.stock <= 5 && <p className="mt-0.5 text-xs font-medium text-amber-700">Only {l.stock} left</p>}
                  <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <QuantitySelector size="sm" value={l.quantity} max={Math.min(l.stock, MAX_PER_LINE)} onChange={(q) => setQuantity(l.productId, q)} label={`Quantity for ${l.name}`} />
                    <p className="font-display text-base font-extrabold">{formatPKR(unit * l.quantity)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <Link href="/shop" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-coral-600">
          <ArrowLeft className="h-4 w-4" /> Continue Shopping
        </Link>
      </div>

      <aside className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6 lg:sticky lg:top-36" aria-label="Order summary">
        <h2 className="text-lg font-bold">Order summary</h2>

        <div className="mt-5">
          {coupon && discount ? (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm">
              <span className="flex items-center gap-2 font-semibold text-emerald-800">
                <Tag className="h-4 w-4" /> {discount.code} applied
              </span>
              <button onClick={removeCoupon} className="rounded p-1 text-emerald-800 hover:bg-emerald-100" aria-label="Remove coupon">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyCoupon();
              }}
              className="flex gap-2"
            >
              <label htmlFor="coupon" className="sr-only">
                Coupon code
              </label>
              <Input id="coupon" placeholder="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} className="uppercase" autoComplete="off" />
              <Button type="submit" variant="outline" loading={checking} disabled={!couponInput.trim()}>
                Apply
              </Button>
            </form>
          )}
          {couponError && (
            <p className="mt-2 text-[13px] text-red-600" role="alert">
              {couponError}
            </p>
          )}
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal ({lines.reduce((n, l) => n + l.quantity, 0)} items)</dt>
            <dd className="font-semibold">{formatPKR(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd className="font-semibold">{delivery === null ? "At checkout" : delivery === 0 ? "Free" : `${formatPKR(delivery)}*`}</dd>
          </div>
          {appliedDiscount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Discount</dt>
              <dd className="font-semibold">−{formatPKR(appliedDiscount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-3 text-base">
            <dt className="font-bold">Total</dt>
            <dd className="font-display text-xl font-extrabold">{formatPKR(total)}</dd>
          </div>
        </dl>
        {delivery !== null && delivery > 0 && <p className="mt-2 text-xs text-muted">*Estimated. Final delivery charge is confirmed at checkout for your city.</p>}
        {freeThreshold !== null && subtotal < freeThreshold && (
          <p className="mt-3 rounded-xl bg-coral-50 px-3 py-2 text-xs font-medium text-coral-700">
            Add {formatPKR(freeThreshold - subtotal)} more for free delivery.
          </p>
        )}

        <ButtonLink href="/checkout" size="lg" className="mt-6 w-full" aria-disabled={refreshing}>
          Proceed to Checkout
        </ButtonLink>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
          <ShieldCheck className="h-3.5 w-3.5" /> Prices and stock are re-checked securely at checkout
        </p>
      </aside>
    </div>
  );
}
