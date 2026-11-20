"use server";
import { contactSchema, newsletterSchema } from "@/lib/validation/schemas";
import { normalizePakistaniPhone } from "@/lib/commerce/phone";
import { fieldErrors } from "@/lib/validation/helpers";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import type { ActionResult } from "@/types";

export async function subscribeNewsletter(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = newsletterSchema.safeParse({ email: formData.get("email") ?? "" });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid email" };
  if (!isServiceRoleConfigured()) return { ok: false, error: "Newsletter signup isn't available yet." };
  if (!(await rateLimit("newsletter", 5, 600))) return { ok: false, error: "Too many attempts. Please try again later." };

  const { error } = await createAdminClient()
    .from("newsletter_subscribers")
    .upsert({ email: parsed.data.email, status: "subscribed", source: "website" }, { onConflict: "email" });
  if (error) {
    console.error("[newsletter]", error);
    return { ok: false, error: "Couldn't subscribe right now. Please try again." };
  }
  return { ok: true, message: "You're subscribed! We'll only email you about new arrivals and offers." };
}

export async function sendContactMessage(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    subject: formData.get("subject") ?? "",
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }
  if (!parsed.data.email && !parsed.data.phone) {
    return { ok: false, error: "Add an email or phone number so we can reply.", fieldErrors: { email: ["Email or phone required"] } };
  }
  if (!isServiceRoleConfigured()) return { ok: false, error: "The contact form isn't available yet." };
  if (!(await rateLimit("contact", 5, 3600))) return { ok: false, error: "Too many messages. Please try again later." };

  const { error } = await createAdminClient()
    .from("contact_messages")
    .insert({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone ? normalizePakistaniPhone(parsed.data.phone) : null,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    });
  if (error) {
    console.error("[contact]", error);
    return { ok: false, error: "Couldn't send your message. Please try again." };
  }
  return { ok: true, message: "Thanks! Your message has been sent. We'll get back to you soon." };
}
