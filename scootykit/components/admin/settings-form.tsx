"use client";
import { useActionState } from "react";
import { saveSettings } from "@/lib/actions/admin/store";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import type { ActionResult, StoreSettings } from "@/types";
import { FormMessage, Panel } from "./ui";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(saveSettings, null);
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k]?.[0] : undefined);
  const v = (k: keyof StoreSettings) => (settings[k] ?? "") as string;
  return (
    <form action={formAction} noValidate className="max-w-4xl space-y-6">
      <FormMessage state={state} />
      <Panel title="Announcement bar">
        <div className="grid gap-4">
          <Checkbox name="announcement_active" defaultChecked={settings.announcement_active} label="Show announcement bar" />
          <Field label="Text" htmlFor="announcement_text" error={err("announcement_text")} hint="Max 160 characters. Only announce offers you actually provide.">
            <Input id="announcement_text" name="announcement_text" maxLength={160} defaultValue={v("announcement_text")} />
          </Field>
          <Field label="Link (optional)" htmlFor="announcement_link" error={err("announcement_link")}>
            <Input id="announcement_link" name="announcement_link" placeholder="/shop or https://…" defaultValue={v("announcement_link")} />
          </Field>
        </div>
      </Panel>

      <Panel title="Contact details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="contact_email" error={err("contact_email")}>
            <Input id="contact_email" name="contact_email" type="email" defaultValue={v("contact_email")} />
          </Field>
          <Field label="Phone" htmlFor="contact_phone" error={err("contact_phone")}>
            <Input id="contact_phone" name="contact_phone" defaultValue={v("contact_phone")} />
          </Field>
          <Field label="WhatsApp number" htmlFor="whatsapp_number" error={err("whatsapp_number")} hint="International format, e.g. 923001234567">
            <Input id="whatsapp_number" name="whatsapp_number" defaultValue={v("whatsapp_number")} />
          </Field>
          <Field label="Business hours" htmlFor="business_hours" error={err("business_hours")}>
            <Input id="business_hours" name="business_hours" placeholder="Mon–Sat, 10am–7pm" defaultValue={v("business_hours")} />
          </Field>
          <Field label="Business address" htmlFor="business_address" error={err("business_address")} className="sm:col-span-2">
            <Textarea id="business_address" name="business_address" rows={2} defaultValue={v("business_address")} />
          </Field>
        </div>
      </Panel>

      <Panel title="Payment methods">
        <div className="grid gap-4">
          <Checkbox name="cod_enabled" defaultChecked={settings.cod_enabled} label="Cash on Delivery" />
          <Checkbox name="bank_transfer_enabled" defaultChecked={settings.bank_transfer_enabled} label="Bank Transfer (orders wait for manual payment verification)" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bank name" htmlFor="bank_name" error={err("bank_name")}>
              <Input id="bank_name" name="bank_name" defaultValue={v("bank_name")} />
            </Field>
            <Field label="Account title" htmlFor="bank_account_title" error={err("bank_account_title")}>
              <Input id="bank_account_title" name="bank_account_title" defaultValue={v("bank_account_title")} />
            </Field>
            <Field label="Account number" htmlFor="bank_account_number" error={err("bank_account_number")}>
              <Input id="bank_account_number" name="bank_account_number" defaultValue={v("bank_account_number")} />
            </Field>
            <Field label="IBAN" htmlFor="bank_iban" error={err("bank_iban")}>
              <Input id="bank_iban" name="bank_iban" defaultValue={v("bank_iban")} />
            </Field>
            <Field label="Instructions for customers" htmlFor="bank_instructions" error={err("bank_instructions")} className="sm:col-span-2">
              <Textarea id="bank_instructions" name="bank_instructions" rows={2} placeholder="e.g. Send a screenshot of the transfer on WhatsApp with your order number." defaultValue={v("bank_instructions")} />
            </Field>
          </div>
          <p className="text-xs text-muted">Online card/wallet payments need a payment provider integration (see README → Future payments).</p>
        </div>
      </Panel>

      <Panel title="Delivery" className="scroll-mt-6">
        <div id="delivery" className="grid gap-4 sm:grid-cols-2">
          <Field label="Free delivery threshold (Rs.)" htmlFor="free_delivery_threshold" error={err("free_delivery_threshold")} hint="Leave blank for no free-delivery offer">
            <Input id="free_delivery_threshold" name="free_delivery_threshold" inputMode="decimal" defaultValue={settings.free_delivery_threshold ?? ""} />
          </Field>
          <Field label="Delivery time text" htmlFor="delivery_estimate_text" error={err("delivery_estimate_text")} hint="Shown on product pages. Only state times you can meet.">
            <Input id="delivery_estimate_text" name="delivery_estimate_text" placeholder="Delivered in 3–5 working days." defaultValue={v("delivery_estimate_text")} />
          </Field>
        </div>
      </Panel>

      <Panel title="Homepage & social">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hero image URL (optional)" htmlFor="hero_image_url" error={err("hero_image_url")} hint="Replaces the illustration. Use an image you own (e.g. uploaded to Supabase Storage)." className="sm:col-span-2">
            <Input id="hero_image_url" name="hero_image_url" defaultValue={v("hero_image_url")} />
          </Field>
          <Field label="Facebook" htmlFor="social_facebook" error={err("social_facebook")}>
            <Input id="social_facebook" name="social_facebook" defaultValue={v("social_facebook")} />
          </Field>
          <Field label="Instagram" htmlFor="social_instagram" error={err("social_instagram")}>
            <Input id="social_instagram" name="social_instagram" defaultValue={v("social_instagram")} />
          </Field>
          <Field label="TikTok" htmlFor="social_tiktok" error={err("social_tiktok")}>
            <Input id="social_tiktok" name="social_tiktok" defaultValue={v("social_tiktok")} />
          </Field>
        </div>
      </Panel>

      <div className="sticky bottom-4 z-10">
        <Button type="submit" size="lg" loading={pending} className="shadow-lg">
          Save settings
        </Button>
      </div>
    </form>
  );
}
