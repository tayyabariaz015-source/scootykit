import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Lock } from "lucide-react";
import { OrderTimeline } from "@/components/checkout/order-timeline";
import { ProductImageFallback } from "@/components/products/product-card";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Badge, EmptyState } from "@/components/ui/misc";
import { getIsAdmin, getUser } from "@/lib/auth/session";
import { mapOrder } from "@/lib/data/account";
import { getStoreSettings } from "@/lib/data/settings";
import { formatPKR } from "@/lib/commerce/format";
import { formatPhone } from "@/lib/commerce/phone";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE } from "@/lib/commerce/status";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { firstParam, formatDate } from "@/lib/utils";

// Depends on the signed-in user — never prerender.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Order Confirmation", robots: { index: false, follow: false } };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrderConfirmationPage({ params, searchParams }: PageProps<"/order-confirmation/[orderNumber]">) {
  const { orderNumber } = await params;
  const token = firstParam((await searchParams).t) ?? "";
  const number = decodeURIComponent(orderNumber).toUpperCase();

  let order = null;
  if (isServiceRoleConfigured() && /^SK-\d{6}-[A-Z0-9]{5}$/.test(number)) {
    const { data } = await createAdminClient()
      .from("orders")
      .select("*, items:order_items(*), history:order_status_history(status, payment_status, created_at)")
      .eq("order_number", number)
      .maybeSingle();
    if (data) {
      const user = await getUser();
      // Access: secret token from checkout, the owning account, or an admin.
      const allowed =
        (UUID_RE.test(token) && token.toLowerCase() === String(data.access_token).toLowerCase()) ||
        (user && data.user_id === user.id) ||
        (user && (await getIsAdmin()));
      if (allowed) order = mapOrder(data);
    }
  }

  if (!order) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={Lock}
          title="Order details are private"
          description="For your security, order details are only shown from the confirmation link, to the account that placed the order, or via order tracking with your phone number."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href="/track-order">Track an order</ButtonLink>
              <ButtonLink href="/login" variant="outline">
                Sign in
              </ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  const settings = order.payment_method === "bank_transfer" ? await getStoreSettings() : null;
  const justPlaced = isRecent(order.created_at, 30);

  return (
    <div className="container-page max-w-4xl py-10 sm:py-14">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">{justPlaced ? "Thank you! Your order is placed." : "Order details"}</h1>
        <p className="mt-2 text-muted">
          Order <span className="font-semibold text-navy-900">{order.order_number}</span> · {formatDate(order.created_at, true)}
        </p>
        {justPlaced && (
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
            Save your order number. You can track it any time using your order number and phone number. Bookmark this page to view these details again.
          </p>
        )}
      </div>

      {order.payment_method === "bank_transfer" && order.payment_status === "awaiting_verification" && order.status !== "cancelled" && settings && (
        <Alert tone="warning" title="Complete your bank transfer" className="mt-8">
          <p>
            Please transfer <strong>{formatPKR(order.total)}</strong> and include <strong>{order.order_number}</strong> as the reference. We&apos;ll process your order once the payment
            is verified.
          </p>
          <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {settings.bank_name && <BankRow label="Bank" value={settings.bank_name} />}
            {settings.bank_account_title && <BankRow label="Account title" value={settings.bank_account_title} />}
            {settings.bank_account_number && <BankRow label="Account number" value={settings.bank_account_number} />}
            {settings.bank_iban && <BankRow label="IBAN" value={settings.bank_iban} />}
          </dl>
          {settings.bank_instructions && <p className="mt-3">{settings.bank_instructions}</p>}
        </Alert>
      )}

      <section className="mt-8 rounded-2xl border border-line p-5 sm:p-6">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-lg font-bold">Status</h2>
          <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
          <Badge tone={PAYMENT_STATUS_TONE[order.payment_status]}>{PAYMENT_STATUS_LABEL[order.payment_status]}</Badge>
        </div>
        <OrderTimeline status={order.status} history={order.history ?? []} />
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-line p-5 sm:p-6">
          <h2 className="text-lg font-bold">Items</h2>
          <ul className="mt-4 divide-y divide-line">
            {order.items?.map((i) => (
              <li key={i.id} className="flex gap-3 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface">
                  {i.image_url ? <Image src={i.image_url} alt="" fill sizes="56px" className="object-cover" /> : <ProductImageFallback />}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  {i.product_slug ? (
                    <Link href={`/product/${i.product_slug}`} className="font-medium hover:text-coral-600">
                      {i.product_name}
                    </Link>
                  ) : (
                    <p className="font-medium">{i.product_name}</p>
                  )}
                  <p className="text-muted">
                    {i.quantity} × {formatPKR(i.unit_price)}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatPKR(i.line_total)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-line pt-4 text-sm">
            <SummaryRow label="Subtotal" value={formatPKR(order.subtotal)} />
            <SummaryRow label="Delivery" value={order.delivery_charge === 0 ? "Free" : formatPKR(order.delivery_charge)} />
            {order.discount > 0 && <SummaryRow label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`} value={`−${formatPKR(order.discount)}`} />}
            <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd className="font-display text-lg font-extrabold">{formatPKR(order.total)}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-5 rounded-2xl border border-line p-5 text-sm sm:p-6">
          <div>
            <h2 className="text-lg font-bold">Delivery</h2>
            <p className="mt-2 font-semibold">{order.customer_name}</p>
            <p className="text-muted">{formatPhone(order.phone)}</p>
            {order.email && <p className="text-muted">{order.email}</p>}
            <p className="mt-2 leading-6 text-navy-800">
              {order.address}
              <br />
              {order.city}, {order.province}
            </p>
            {order.notes && <p className="mt-2 text-muted">Note: {order.notes}</p>}
          </div>
          <div>
            <h2 className="text-lg font-bold">Payment</h2>
            <p className="mt-2">{PAYMENT_METHOD_LABEL[order.payment_method]}</p>
            <p className="text-muted">{PAYMENT_STATUS_LABEL[order.payment_status]}</p>
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/shop">Continue shopping</ButtonLink>
        <ButtonLink href="/track-order" variant="outline">
          Track order
        </ButtonLink>
      </div>
    </div>
  );
}

function isRecent(iso: string, minutes: number) {
  return Date.now() - new Date(iso).getTime() < minutes * 60_000;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="opacity-75">{label}:</dt>
      <dd className="select-all font-semibold">{value}</dd>
    </div>
  );
}
