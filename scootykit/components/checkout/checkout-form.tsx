"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Building2, Lock, ShoppingBag, Tag, X } from "lucide-react";
import { getCheckoutQuote, placeOrder, type CheckoutQuote } from "@/lib/actions/checkout";
import { cartStore, clearCart, useCart } from "@/lib/client/cart-store";
import { couponStore } from "@/lib/client/coupon-store";
import { formatPKR } from "@/lib/commerce/format";
import { MAJOR_CITIES, PROVINCES } from "@/lib/commerce/pakistan";
import { effectivePrice } from "@/lib/commerce/pricing";
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/validation/schemas";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert, EmptyState } from "@/components/ui/misc";
import { ProductImageFallback } from "@/components/products/product-card";
import { cn } from "@/lib/utils";
import type { Address } from "@/types";

export interface CheckoutDefaults {
  full_name: string;
  phone: string;
  email: string;
  addresses: Address[];
}

export interface PaymentOptions {
  cod: boolean;
  bankTransfer: boolean;
}

function newKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function CheckoutForm({ defaults, payment }: { defaults: CheckoutDefaults; payment: PaymentOptions }) {
  const router = useRouter();
  const lines = useCart();
  const hydrated = cartStore.useHydrated();
  const storedCoupon = couponStore.useStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  const defaultAddress = defaults.addresses.find((a) => a.is_default) ?? defaults.addresses[0];
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onTouched",
    defaultValues: {
      full_name: defaultAddress?.full_name ?? defaults.full_name,
      phone: defaultAddress?.phone ?? defaults.phone,
      email: defaults.email,
      province: (defaultAddress?.province as CheckoutFormValues["province"]) ?? ("" as CheckoutFormValues["province"]),
      city: defaultAddress?.city ?? "",
      address: defaultAddress?.address_line ?? "",
      notes: "",
      payment_method: payment.cod ? "cod" : "bank_transfer",
      coupon_code: storedCoupon,
    },
  });
  const { register, handleSubmit, formState, setValue, control } = form;
  const errors = formState.errors;
  const [province, city, couponCode, paymentMethod] = useWatch({ control, name: ["province", "city", "coupon_code", "payment_method"] });

  // Keep the coupon field in sync with a coupon applied on the cart page.
  const [syncedCoupon, setSyncedCoupon] = useState(storedCoupon);
  if (storedCoupon !== syncedCoupon) {
    setSyncedCoupon(storedCoupon);
    setValue("coupon_code", storedCoupon);
  }

  const items = useMemo(() => lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })), [lines]);
  const itemsKey = items.map((i) => `${i.product_id}:${i.quantity}`).join("|");

  // Live server-side quote (prices, delivery for the chosen city, coupon).
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    const t = setTimeout(() => {
      setQuoting(true);
      getCheckoutQuote({ items, province: province ?? "", city: city ?? "", couponCode: couponCode ?? "" })
        .then((q) => !cancelled && setQuote(q))
        .finally(() => !cancelled && setQuoting(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, province, city, couponCode]);

  if (!hydrated) {
    return <div className="skeleton h-[600px] rounded-2xl" aria-busy="true" />;
  }

  if (lines.length === 0 && !placed) {
    return (
      <EmptyState icon={ShoppingBag} title="Your cart is empty" description="Add some accessories before checking out." action={<ButtonLink href="/shop">Shop now</ButtonLink>} />
    );
  }

  if (!payment.cod && !payment.bankTransfer) {
    return <Alert tone="warning" title="Checkout is temporarily unavailable">No payment methods are enabled right now. Please contact us to place your order.</Alert>;
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    // Same key for retries of one attempt → the server never creates a duplicate order.
    const key = idempotencyKey ?? newKey();
    setIdempotencyKey(key);
    const res = await placeOrder({ ...values, items, idempotency_key: key });
    if (!res.ok) {
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [k, v] of Object.entries(res.fieldErrors)) {
          if (v?.[0] && k in values) form.setError(k as keyof CheckoutFormValues, { message: v[0] });
        }
      }
      // A failed order was not created; a fresh key lets the corrected attempt go through.
      setIdempotencyKey(null);
      return;
    }
    setPlaced(true);
    clearCart();
    couponStore.set("");
    router.replace(`/order-confirmation/${res.data!.orderNumber}?t=${res.data!.token}`);
  });

  const localSubtotal = lines.reduce((s, l) => s + effectivePrice({ price: l.price, sale_price: l.salePrice }) * l.quantity, 0);
  const subtotal = quote?.subtotal ?? localSubtotal;
  const discount = quote?.couponCode ? quote.discount : 0;
  const delivery = quote?.delivery ?? null;
  const total = Math.max(subtotal - discount + (delivery ?? 0), 0);
  const issues = new Map((quote?.issues ?? []).map((i) => [i.productId, i.message]));

  return (
    <form onSubmit={onSubmit} noValidate className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        {serverError && (
          <Alert tone="danger" title="We couldn't place your order">
            {serverError}{" "}
            {issues.size > 0 && (
              <Link href="/cart" className="font-semibold underline">
                Review cart
              </Link>
            )}
          </Alert>
        )}

        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold">Contact &amp; delivery</h2>
          {defaults.addresses.length > 1 && (
            <div className="mt-4">
              <label htmlFor="saved-address" className="mb-1.5 block text-sm font-semibold">
                Use a saved address
              </label>
              <Select
                id="saved-address"
                defaultValue={defaultAddress?.id}
                onChange={(e) => {
                  const a = defaults.addresses.find((x) => x.id === e.target.value);
                  if (!a) return;
                  setValue("full_name", a.full_name, { shouldValidate: true });
                  setValue("phone", a.phone, { shouldValidate: true });
                  setValue("province", a.province as CheckoutFormValues["province"], { shouldValidate: true });
                  setValue("city", a.city, { shouldValidate: true });
                  setValue("address", a.address_line, { shouldValidate: true });
                }}
              >
                {defaults.addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} — {a.address_line.slice(0, 40)}, {a.city}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message} required className="sm:col-span-2">
              <Input id="full_name" autoComplete="name" aria-invalid={!!errors.full_name} aria-describedby={errors.full_name ? "full_name-error" : undefined} {...register("full_name")} />
            </Field>
            <Field label="Mobile number" htmlFor="phone" error={errors.phone?.message} hint="03XXXXXXXXX or +923XXXXXXXXX" required>
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="03001234567" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} {...register("phone")} />
            </Field>
            <Field label="Email (optional)" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register("email")} />
            </Field>
            <Field label="Province" htmlFor="province" error={errors.province?.message} required>
              <Select id="province" autoComplete="address-level1" aria-invalid={!!errors.province} {...register("province")}>
                <option value="">Select province</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="City" htmlFor="city" error={errors.city?.message} required>
              <Input id="city" list="pk-cities" autoComplete="address-level2" placeholder="e.g. Lahore" aria-invalid={!!errors.city} {...register("city")} />
              <datalist id="pk-cities">
                {MAJOR_CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Complete address" htmlFor="address" error={errors.address?.message} hint="House no., street, block/sector, area, nearby landmark" required className="sm:col-span-2">
              <Textarea id="address" rows={3} autoComplete="street-address" aria-invalid={!!errors.address} {...register("address")} />
            </Field>
            <Field label="Order notes (optional)" htmlFor="notes" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea id="notes" rows={2} placeholder="Delivery instructions, preferred time…" {...register("notes")} />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold">Payment method</h2>
          <div className="mt-4 grid gap-3" role="radiogroup" aria-label="Payment method">
            {payment.cod && (
              <PaymentOption id="pm-cod" value="cod" checked={paymentMethod === "cod"} icon={Banknote} title="Cash on Delivery" text="Pay in cash when your order is delivered." register={register("payment_method")} />
            )}
            {payment.bankTransfer && (
              <PaymentOption
                id="pm-bank"
                value="bank_transfer"
                checked={paymentMethod === "bank_transfer"}
                icon={Building2}
                title="Bank Transfer"
                text="Transfer to our bank account. Your order is processed after we verify the payment — account details are shown after you place the order."
                register={register("payment_method")}
              />
            )}
          </div>
          {errors.payment_method && <p className="mt-2 text-[13px] text-red-600">{errors.payment_method.message}</p>}
          <p className="mt-4 text-xs text-muted">Online card/wallet payments are not available yet.</p>
        </section>
      </div>

      <aside className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6 lg:sticky lg:top-36" aria-label="Order summary">
        <h2 className="text-lg font-bold">Your order</h2>
        <ul className="mt-4 max-h-80 space-y-3.5 overflow-y-auto pr-1">
          {lines.map((l) => (
            <li key={l.productId} className="flex gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface">
                {l.image ? <Image src={l.image} alt="" fill sizes="56px" className="object-cover" /> : <ProductImageFallback />}
                <span className="absolute -right-0 -top-0 grid h-5 min-w-5 place-items-center rounded-bl-lg bg-navy-900 px-1 text-[11px] font-bold text-white">{l.quantity}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">{l.name}</p>
                {issues.get(l.productId) && <p className="text-xs font-semibold text-red-600">{issues.get(l.productId)}</p>}
              </div>
              <p className="text-sm font-semibold">{formatPKR(effectivePrice({ price: l.price, sale_price: l.salePrice }) * l.quantity)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-line pt-5">
          <label htmlFor="coupon_code" className="mb-1.5 block text-sm font-semibold">
            Coupon code
          </label>
          <div className="relative">
            <Tag className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input id="coupon_code" className="pl-10 uppercase" autoComplete="off" placeholder="Optional" {...register("coupon_code", { onChange: (e) => couponStore.set(e.target.value.trim().toUpperCase()) })} />
            {couponCode && (
              <button
                type="button"
                onClick={() => {
                  setValue("coupon_code", "");
                  couponStore.set("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-navy-900"
                aria-label="Remove coupon"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {quote?.couponError && couponCode && <p className="mt-1.5 text-[13px] text-red-600">{quote.couponError}</p>}
          {quote?.couponCode && <p className="mt-1.5 text-[13px] font-medium text-emerald-700">{quote.couponCode} applied</p>}
        </div>

        <dl className={cn("mt-5 space-y-3 text-sm transition-opacity", quoting && "opacity-60")} aria-busy={quoting}>
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-semibold">{formatPKR(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd className="font-semibold">{delivery === null ? (province ? "Not available" : "Select province") : delivery === 0 ? "Free" : formatPKR(delivery)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Discount</dt>
              <dd className="font-semibold">−{formatPKR(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-3 text-base">
            <dt className="font-bold">Total</dt>
            <dd className="font-display text-xl font-extrabold">{formatPKR(total)}</dd>
          </div>
        </dl>

        <Button type="submit" size="lg" className="mt-6 h-13 w-full" loading={formState.isSubmitting || placed} disabled={issues.size > 0}>
          <Lock className="h-4 w-4" /> Place Order
        </Button>
        {issues.size > 0 && (
          <p className="mt-2 text-center text-[13px] text-red-600">
            Some items need attention.{" "}
            <Link href="/cart" className="font-semibold underline">
              Update cart
            </Link>
          </p>
        )}
        <p className="mt-3 text-center text-xs leading-5 text-muted">
          By placing your order you agree to our{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/returns" className="underline">
            Return Policy
          </Link>
          . Final prices and stock are confirmed securely when you place the order.
        </p>
      </aside>
    </form>
  );
}

function PaymentOption({
  id,
  value,
  checked,
  icon: Icon,
  title,
  text,
  register,
}: {
  id: string;
  value: string;
  checked: boolean;
  icon: typeof Banknote;
  title: string;
  text: string;
  register: ReturnType<ReturnType<typeof useForm<CheckoutFormValues>>["register"]>;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer gap-3.5 rounded-xl border-2 p-4 transition-colors",
        checked ? "border-coral-500 bg-coral-50/50" : "border-line hover:border-navy-900/20",
      )}
    >
      <input id={id} type="radio" value={value} className="mt-1 h-4 w-4 accent-coral-500" {...register} />
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", checked ? "text-coral-600" : "text-navy-700")} />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{text}</span>
      </span>
    </label>
  );
}
