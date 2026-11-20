"use client";
import { useActionState, useState } from "react";
import { updateOrder } from "@/lib/actions/admin/store";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, PAYMENT_STATUSES, PAYMENT_STATUS_LABEL } from "@/lib/commerce/status";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Select, Textarea } from "@/components/ui/field";
import type { ActionResult, Order } from "@/types";
import { FormMessage } from "./ui";

export function OrderStatusForm({ order }: { order: Order }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(updateOrder, null);
  const [status, setStatus] = useState(order.status);
  const locked = order.status === "cancelled";
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="order_id" value={order.id} />
      <FormMessage state={state} />
      <Field label="Order status" htmlFor="status">
        <Select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value as Order["status"])} disabled={locked}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </Field>
      {locked && <input type="hidden" name="status" value="cancelled" />}
      <Field label="Payment status" htmlFor="payment_status" hint={order.payment_method === "bank_transfer" ? "Mark as Paid only after confirming the transfer in your bank account." : "For COD, mark as Paid once the courier remits the cash."}>
        <Select id="payment_status" name="payment_status" defaultValue={order.payment_status}>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </Field>
      {status === "cancelled" && !locked && (
        <Checkbox name="confirm_cancel" label="Confirm cancellation — items return to stock. This can't be undone." className="rounded-xl bg-red-50 p-3 text-red-800" />
      )}
      <Field label="Note for history (optional)" htmlFor="note" hint="e.g. courier & tracking number">
        <Textarea id="note" name="note" rows={2} maxLength={500} />
      </Field>
      <Field label="Internal notes" htmlFor="admin_notes" hint="Private — never shown to the customer">
        <Textarea id="admin_notes" name="admin_notes" rows={3} defaultValue={order.admin_notes ?? ""} />
      </Field>
      <Button type="submit" loading={pending} className="w-full">
        Update order
      </Button>
    </form>
  );
}
