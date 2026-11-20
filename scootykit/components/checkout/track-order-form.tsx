"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackageSearch } from "lucide-react";
import { trackOrder, type TrackedOrder } from "@/lib/actions/checkout";
import { trackOrderSchema, type TrackOrderValues } from "@/lib/validation/schemas";
import { formatPKR } from "@/lib/commerce/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE } from "@/lib/commerce/status";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert, Badge } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";
import { OrderTimeline } from "./order-timeline";

export function TrackOrderForm({ initialOrderNumber }: { initialOrderNumber?: string }) {
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<TrackOrderValues>({
    resolver: zodResolver(trackOrderSchema),
    defaultValues: { order_number: initialOrderNumber ?? "", phone: "" },
  });
  const { errors, isSubmitting } = form.formState;

  return (
    <div className="space-y-8">
      <form
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          setError(null);
          const res = await trackOrder(values);
          if (res.ok) setResult(res.data!);
          else {
            setResult(null);
            setError(res.error);
          }
        })}
        className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-7"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
          <Field label="Order number" htmlFor="order_number" error={errors.order_number?.message} required>
            <Input id="order_number" placeholder="SK-261119-AB2CD" className="uppercase" autoComplete="off" aria-invalid={!!errors.order_number} {...form.register("order_number")} />
          </Field>
          <Field label="Phone used at checkout" htmlFor="track-phone" error={errors.phone?.message} required>
            <Input id="track-phone" type="tel" inputMode="tel" placeholder="03001234567" autoComplete="tel" aria-invalid={!!errors.phone} {...form.register("phone")} />
          </Field>
          <Button type="submit" size="lg" loading={isSubmitting} className="h-11 sm:mt-[1.85rem]">
            <PackageSearch className="h-4.5 w-4.5" /> Track
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted">Both details must match your order. We never show addresses on this page.</p>
      </form>

      {error && <Alert tone="danger">{error}</Alert>}

      {result && (
        <section className="animate-fade-up rounded-2xl border border-line p-5 sm:p-7" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Hi {result.first_name}, here&apos;s your order</p>
              <h2 className="text-xl font-bold">{result.order_number}</h2>
              <p className="text-sm text-muted">
                Placed {formatDate(result.created_at, true)} · Delivering to {result.city}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={ORDER_STATUS_TONE[result.status]}>{ORDER_STATUS_LABEL[result.status]}</Badge>
              <Badge tone={PAYMENT_STATUS_TONE[result.payment_status]}>{PAYMENT_STATUS_LABEL[result.payment_status]}</Badge>
            </div>
          </div>
          <div className="my-7">
            <OrderTimeline status={result.status} history={result.history} />
          </div>
          <div className="grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-2">
            <div>
              <h3 className="font-semibold">Items</h3>
              <ul className="mt-2 space-y-1 text-muted">
                {result.items.map((i, idx) => (
                  <li key={`${i.name}-${idx}`}>
                    {i.quantity} × {i.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="sm:text-right">
              <h3 className="font-semibold">Total</h3>
              <p className="mt-2 font-display text-xl font-extrabold">{formatPKR(result.total)}</p>
              <p className="text-muted">{PAYMENT_METHOD_LABEL[result.payment_method]}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
