"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/session";
import { slugify } from "@/lib/commerce/slug";
import { createClient } from "@/lib/supabase/server";
import { categoryAdminSchema, couponAdminSchema, deliveryZoneSchema, orderUpdateSchema, settingsSchema } from "@/lib/validation/schemas";
import { fieldErrors } from "@/lib/validation/helpers";
import type { ActionResult } from "@/types";
import { removeStorageObjects, uploadImageFile, BUCKET } from "./storage";

const refresh = () => revalidatePath("/", "layout");
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");
const bool = (fd: FormData, k: string) => fd.get(k) === "on";

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export async function saveCategory(categoryId: string | null, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (categoryId !== null && !z.uuid().safeParse(categoryId).success) return { ok: false, error: "Invalid category." };
  const parsed = categoryAdminSchema.safeParse({
    name: str(formData, "name"),
    slug: str(formData, "slug"),
    description: str(formData, "description"),
    icon: str(formData, "icon"),
    sort_order: str(formData, "sort_order"),
    is_visible: bool(formData, "is_visible"),
    seo_title: str(formData, "seo_title"),
    seo_description: str(formData, "seo_description"),
  });
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const row = { ...parsed.data, slug: parsed.data.slug || slugify(parsed.data.name) };

  let id = categoryId;
  if (id) {
    const { error } = await supabase.from("categories").update(row).eq("id", id);
    if (error) return categoryError(error);
  } else {
    const { data, error } = await supabase.from("categories").insert(row).select("id").single();
    if (error) return categoryError(error);
    id = data.id;
  }

  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const res = await uploadImageFile(supabase, image, `categories/${id}`);
    if ("error" in res) return { ok: false, error: `Saved, but image upload failed: ${res.error}` };
    const { data: old } = await supabase.from("categories").select("image_url").eq("id", id).single();
    await supabase.from("categories").update({ image_url: res.url }).eq("id", id);
    const oldPath = old?.image_url?.split(`/${BUCKET}/`)[1];
    if (oldPath) await removeStorageObjects(supabase, [oldPath]);
  } else if (bool(formData, "remove_image")) {
    const { data: old } = await supabase.from("categories").select("image_url").eq("id", id).single();
    await supabase.from("categories").update({ image_url: null }).eq("id", id);
    const oldPath = old?.image_url?.split(`/${BUCKET}/`)[1];
    if (oldPath) await removeStorageObjects(supabase, [oldPath]);
  }

  refresh();
  revalidatePath("/admin/categories");
  if (!categoryId) redirect("/admin/categories?created=1");
  return { ok: true, message: "Category saved." };
}

function categoryError(error: { code?: string; message: string }): ActionResult {
  if (error.code === "23505") return { ok: false, error: "That slug is already used by another category.", fieldErrors: { slug: ["Already in use"] } };
  console.error("[admin:category]", error);
  return { ok: false, error: "Couldn't save the category." };
}

export async function toggleCategoryVisibility(id: string, visible: boolean): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Invalid category." };
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ is_visible: visible }).eq("id", id);
  if (error) return { ok: false, error: "Couldn't update visibility." };
  refresh();
  revalidatePath("/admin/categories");
  return { ok: true };
}

/** Only empty categories can be deleted — prefer hiding to keep URLs stable. */
export async function deleteCategory(id: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Invalid category." };
  const supabase = await createClient();
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if ((count ?? 0) > 0) return { ok: false, error: "This category still has products. Move them first, or hide the category instead." };
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn't delete the category." };
  refresh();
  revalidatePath("/admin/categories");
  return { ok: true, message: "Category deleted." };
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export async function updateOrder(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = orderUpdateSchema.safeParse({
    order_id: str(formData, "order_id"),
    status: str(formData, "status"),
    payment_status: str(formData, "payment_status"),
    note: str(formData, "note"),
  });
  if (!parsed.success) return { ok: false, error: "Invalid status update." };
  const v = parsed.data;
  if (v.status === "cancelled" && formData.get("confirm_cancel") !== "on") {
    return { ok: false, error: "Tick “Confirm cancellation” — cancelling returns items to stock and can't be undone." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_order", {
    p_order_id: v.order_id,
    p_status: v.status,
    p_payment_status: v.payment_status,
    p_note: v.note || null,
  });
  if (error) {
    if (error.message.includes("ORDER_CANCELLED")) return { ok: false, error: "Cancelled orders can't be reopened. Ask the customer to place a new order." };
    console.error("[admin:order]", error);
    return { ok: false, error: "Couldn't update the order." };
  }
  const notes = formData.get("admin_notes");
  if (typeof notes === "string") {
    await supabase.from("orders").update({ admin_notes: notes.trim().slice(0, 2000) || null }).eq("id", v.order_id);
  }
  refresh();
  revalidatePath(`/admin/orders/${v.order_id}`);
  revalidatePath("/admin/orders");
  return { ok: true, message: "Order updated." };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export async function saveSettings(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = settingsSchema.safeParse({
    announcement_text: str(formData, "announcement_text"),
    announcement_link: str(formData, "announcement_link"),
    announcement_active: bool(formData, "announcement_active"),
    contact_email: str(formData, "contact_email"),
    contact_phone: str(formData, "contact_phone"),
    whatsapp_number: str(formData, "whatsapp_number"),
    business_address: str(formData, "business_address"),
    business_hours: str(formData, "business_hours"),
    cod_enabled: bool(formData, "cod_enabled"),
    bank_transfer_enabled: bool(formData, "bank_transfer_enabled"),
    bank_name: str(formData, "bank_name"),
    bank_account_title: str(formData, "bank_account_title"),
    bank_account_number: str(formData, "bank_account_number"),
    bank_iban: str(formData, "bank_iban"),
    bank_instructions: str(formData, "bank_instructions"),
    free_delivery_threshold: str(formData, "free_delivery_threshold"),
    delivery_estimate_text: str(formData, "delivery_estimate_text"),
    hero_image_url: str(formData, "hero_image_url"),
    social_facebook: str(formData, "social_facebook"),
    social_instagram: str(formData, "social_instagram"),
    social_tiktok: str(formData, "social_tiktok"),
  });
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  if (v.announcement_active && !v.announcement_text) return { ok: false, error: "Add announcement text or turn the announcement off.", fieldErrors: { announcement_text: ["Required when active"] } };
  if (v.bank_transfer_enabled && !(v.bank_account_number || v.bank_iban)) {
    return { ok: false, error: "Add an account number or IBAN before enabling bank transfer.", fieldErrors: { bank_account_number: ["Required"] } };
  }
  if (!v.cod_enabled && !v.bank_transfer_enabled) return { ok: false, error: "Enable at least one payment method, or customers can't check out." };

  const supabase = await createClient();
  const { error } = await supabase.from("store_settings").update(v).eq("id", 1);
  if (error) {
    console.error("[admin:settings]", error);
    return { ok: false, error: "Couldn't save settings." };
  }
  refresh();
  return { ok: true, message: "Settings saved." };
}

// ---------------------------------------------------------------------------
// Delivery zones
// ---------------------------------------------------------------------------
export async function saveDeliveryZone(zoneId: string | null, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (zoneId !== null && !z.uuid().safeParse(zoneId).success) return { ok: false, error: "Invalid zone." };
  const parsed = deliveryZoneSchema.safeParse({
    name: str(formData, "name"),
    province: str(formData, "province"),
    city: str(formData, "city"),
    charge: str(formData, "charge"),
    is_active: bool(formData, "is_active"),
  });
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = zoneId
    ? await supabase.from("delivery_zones").update(parsed.data).eq("id", zoneId)
    : await supabase.from("delivery_zones").insert(parsed.data);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "A zone for that province/city already exists." };
    return { ok: false, error: "Couldn't save the delivery zone." };
  }
  refresh();
  revalidatePath("/admin/delivery");
  return { ok: true, message: "Delivery zone saved." };
}

export async function deleteDeliveryZone(zoneId: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!z.uuid().safeParse(zoneId).success) return { ok: false, error: "Invalid zone." };
  const supabase = await createClient();
  const { error } = await supabase.from("delivery_zones").delete().eq("id", zoneId);
  if (error) return { ok: false, error: "Couldn't delete the zone." };
  refresh();
  revalidatePath("/admin/delivery");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------
export async function saveCoupon(couponId: string | null, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (couponId !== null && !z.uuid().safeParse(couponId).success) return { ok: false, error: "Invalid coupon." };
  const parsed = couponAdminSchema.safeParse({
    code: str(formData, "code"),
    description: str(formData, "description"),
    discount_type: str(formData, "discount_type"),
    discount_value: str(formData, "discount_value"),
    min_order_amount: str(formData, "min_order_amount") || "0",
    max_discount: str(formData, "max_discount"),
    starts_at: str(formData, "starts_at"),
    expires_at: str(formData, "expires_at"),
    usage_limit: str(formData, "usage_limit"),
    per_customer_limit: str(formData, "per_customer_limit"),
    is_active: bool(formData, "is_active"),
  });
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = couponId ? await supabase.from("coupons").update(parsed.data).eq("id", couponId) : await supabase.from("coupons").insert(parsed.data);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "That coupon code already exists.", fieldErrors: { code: ["Already exists"] } };
    console.error("[admin:coupon]", error);
    return { ok: false, error: "Couldn't save the coupon." };
  }
  revalidatePath("/admin/coupons");
  if (!couponId) redirect("/admin/coupons");
  return { ok: true, message: "Coupon saved." };
}

export async function deleteCoupon(couponId: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!z.uuid().safeParse(couponId).success) return { ok: false, error: "Invalid coupon." };
  const supabase = await createClient();
  const { data } = await supabase.from("coupons").select("times_used").eq("id", couponId).single();
  if ((data?.times_used ?? 0) > 0) {
    await supabase.from("coupons").update({ is_active: false }).eq("id", couponId);
    revalidatePath("/admin/coupons");
    return { ok: true, message: "Coupon has been used, so it was deactivated instead of deleted." };
  }
  const { error } = await supabase.from("coupons").delete().eq("id", couponId);
  if (error) return { ok: false, error: "Couldn't delete the coupon." };
  revalidatePath("/admin/coupons");
  return { ok: true, message: "Coupon deleted." };
}

// ---------------------------------------------------------------------------
// Reviews, newsletter, messages
// ---------------------------------------------------------------------------
export async function moderateReview(reviewId: string, action: "approve" | "unapprove" | "delete"): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!z.uuid().safeParse(reviewId).success) return { ok: false, error: "Invalid review." };
  const supabase = await createClient();
  const { error } =
    action === "delete"
      ? await supabase.from("reviews").delete().eq("id", reviewId)
      : await supabase.from("reviews").update({ is_approved: action === "approve" }).eq("id", reviewId);
  if (error) return { ok: false, error: "Couldn't update the review." };
  refresh();
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function removeSubscriber(id: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Invalid subscriber." };
  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn't remove subscriber." };
  revalidatePath("/admin/newsletter");
  return { ok: true };
}

export async function markMessage(id: string, read: boolean): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Invalid message." };
  const supabase = await createClient();
  await supabase.from("contact_messages").update({ is_read: read }).eq("id", id);
  revalidatePath("/admin/messages");
  return { ok: true };
}
