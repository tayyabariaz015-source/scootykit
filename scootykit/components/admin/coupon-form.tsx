"use client";
import { useActionState } from "react";
import { saveCoupon } from "@/lib/actions/admin/store";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import type { ActionResult, Coupon } from "@/types";
import { FormMessage, Panel } from "./ui";

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CouponForm({ coupon }: { coupon: Coupon | null }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(saveCoupon.bind(null, coupon?.id ?? null), null);
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k]?.[0] : undefined);
  return (
    <form action={formAction} noValidate className="max-w-3xl space-y-6">
      <FormMessage state={state} />
      <Panel title="Coupon">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" htmlFor="code" error={err("code")} required>
            <Input id="code" name="code" className="uppercase" defaultValue={coupon?.code} placeholder="WELCOME10" />
          </Field>
          <Field label="Internal description" htmlFor="description" error={err("description")}>
            <Input id="description" name="description" defaultValue={coupon?.description ?? ""} />
          </Field>
          <Field label="Discount type" htmlFor="discount_type">
            <Select id="discount_type" name="discount_type" defaultValue={coupon?.discount_type ?? "percent"}>
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed amount (Rs.)</option>
            </Select>
          </Field>
          <Field label="Discount value" htmlFor="discount_value" error={err("discount_value")} required>
            <Input id="discount_value" name="discount_value" inputMode="decimal" defaultValue={coupon?.discount_value ?? ""} />
          </Field>
          <Field label="Minimum order (Rs.)" htmlFor="min_order_amount" error={err("min_order_amount")}>
            <Input id="min_order_amount" name="min_order_amount" inputMode="decimal" defaultValue={coupon?.min_order_amount ?? 0} />
          </Field>
          <Field label="Maximum discount (Rs.)" htmlFor="max_discount" error={err("max_discount")} hint="Optional cap for % coupons">
            <Input id="max_discount" name="max_discount" inputMode="decimal" defaultValue={coupon?.max_discount ?? ""} />
          </Field>
          <Field label="Starts" htmlFor="starts_at" error={err("starts_at")}>
            <Input id="starts_at" name="starts_at" type="datetime-local" defaultValue={toLocalInput(coupon?.starts_at ?? null)} />
          </Field>
          <Field label="Expires" htmlFor="expires_at" error={err("expires_at")}>
            <Input id="expires_at" name="expires_at" type="datetime-local" defaultValue={toLocalInput(coupon?.expires_at ?? null)} />
          </Field>
          <Field label="Total usage limit" htmlFor="usage_limit" error={err("usage_limit")} hint="Blank = unlimited">
            <Input id="usage_limit" name="usage_limit" inputMode="numeric" defaultValue={coupon?.usage_limit ?? ""} />
          </Field>
          <Field label="Uses per customer (by phone)" htmlFor="per_customer_limit" error={err("per_customer_limit")} hint="Blank = unlimited">
            <Input id="per_customer_limit" name="per_customer_limit" inputMode="numeric" defaultValue={coupon?.per_customer_limit ?? ""} />
          </Field>
        </div>
        <Checkbox name="is_active" defaultChecked={coupon?.is_active ?? true} label="Active" className="mt-5" />
      </Panel>
      <Button type="submit" size="lg" loading={pending}>
        {coupon ? "Save coupon" : "Create coupon"}
      </Button>
    </form>
  );
}
