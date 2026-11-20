"use client";
import { useActionState } from "react";
import { sendContactMessage } from "@/lib/actions/engagement";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/misc";
import type { ActionResult } from "@/types";

export function ContactForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(sendContactMessage, null);
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k]?.[0] : undefined);
  if (state?.ok) return <Alert tone="success" title="Message sent">{state.message}</Alert>;
  return (
    <form action={action} noValidate className="space-y-4">
      {state && !state.ok && <Alert tone="danger">{state.error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="c-name" error={err("name")} required className="sm:col-span-2">
          <Input id="c-name" name="name" autoComplete="name" required />
        </Field>
        <Field label="Email" htmlFor="c-email" error={err("email")}>
          <Input id="c-email" name="email" type="email" autoComplete="email" />
        </Field>
        <Field label="Mobile number" htmlFor="c-phone" error={err("phone")}>
          <Input id="c-phone" name="phone" type="tel" autoComplete="tel" placeholder="03001234567" />
        </Field>
        <Field label="Subject" htmlFor="c-subject" error={err("subject")} className="sm:col-span-2">
          <Input id="c-subject" name="subject" placeholder="Order question, product enquiry…" />
        </Field>
        <Field label="Message" htmlFor="c-message" error={err("message")} required className="sm:col-span-2">
          <Textarea id="c-message" name="message" rows={5} required />
        </Field>
      </div>
      <p className="text-xs text-muted">Add an email or phone so we can reply. For order questions, include your order number.</p>
      <Button type="submit" size="lg" loading={pending}>
        Send message
      </Button>
    </form>
  );
}
