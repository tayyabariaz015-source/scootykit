"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { getProductsByIds } from "@/lib/data/catalog";
import { couponErrorMessage, orderErrorMessage } from "@/lib/commerce/errors";
import { normalizePakistaniPhone } from "@/lib/commerce/phone";
import { effectivePrice } from "@/lib/commerce/pricing";
import { isSupabaseConfigured } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import { trackOrderSchema, placeOrderSchema, cartLineSchema } from "@/lib/validation/schemas";
import { fieldErrors } from "@/lib/validation/helpers";
import type { ActionResult, OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

const linesSchema = z.array(cartLineSchema).max(50);

export interface CheckoutQuote {
  subtotal: number;
  delivery: number | null;
  discount: number;
  total: number;
  couponCode: string | null;
  couponError: string | null;
  issues: { productId: string; message: string }[];
}

/**
 * Server-side quote for the checkout summary: DB prices, live stock, delivery
 * zone and coupon. Display only — create_order() recalculates everything.
 */
export async function getCheckoutQuote(input: {
  items: { product_id: string; quantity: number }[];
  province?: string;
  city?: string;
  couponCode?: string;
}): Promise<CheckoutQuote | null> {
  const empty: CheckoutQuote = { subtotal: 0, delivery: null, discount: 0, total: 0, couponCode: null, couponError: null, issues: [] };
  const lines = linesSchema.safeParse(input.items);
  if (!isSupabaseConfigured()) return null;
  if (!lines.success) return empty;

  const products = await getProductsByIds(lines.data.map((l) => l.product_id));
  const byId = new Map(products.map((p) => [p.id, p]));
  const issues: CheckoutQuote["issues"] = [];
  let subtotal = 0;
  for (const l of lines.data) {
    const p = byId.get(l.product_id);
    if (!p) {
      issues.push({ productId: l.product_id, message: "No longer available" });
      continue;
    }
    if (p.stock < l.quantity) {
      issues.push({ productId: l.product_id, message: p.stock > 0 ? `Only ${p.stock} in stock` : "Out of stock" });
    }
    subtotal += effectivePrice(p) * l.quantity;
  }

  let delivery: number | null = null;
  const province = (input.province ?? "").slice(0, 80);
  const city = (input.city ?? "").slice(0, 80);
  const { data: charge } = await createPublicClient().rpc("resolve_delivery_charge", {
    p_province: province,
    p_city: city,
    p_subtotal: subtotal,
  });
  if (charge !== null && charge !== undefined) delivery = Number(charge);

  let discount = 0;
  let couponCode: string | null = null;
  let couponError: string | null = null;
  const code = (input.couponCode ?? "").trim().toUpperCase().slice(0, 32);
  if (code && isServiceRoleConfigured()) {
    if (!(await rateLimit("coupon", 30, 600))) {
      couponError = "Too many coupon attempts. Please wait a few minutes.";
    } else {
      const { data, error } = await createAdminClient().rpc("evaluate_coupon", { p_code: code, p_subtotal: subtotal, p_phone: null });
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row) couponError = "Couldn't check that coupon right now.";
      else if (row.error) couponError = couponErrorMessage(row.error, Number(row.discount));
      else {
        discount = Number(row.discount);
        couponCode = row.code;
      }
    }
  }

  return {
    subtotal,
    delivery,
    discount,
    total: Math.max(subtotal - discount + (delivery ?? 0), 0),
    couponCode,
    couponError,
    issues,
  };
}

/** Places an order atomically through public.create_order(). */
export async function placeOrder(input: unknown): Promise<ActionResult<{ orderNumber: string; token: string }>> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }
  if (!isServiceRoleConfigured()) {
    return { ok: false, error: "Checkout isn't configured yet. Please contact the store." };
  }
  if (!(await rateLimit("checkout", 8, 600))) {
    return { ok: false, error: "Too many order attempts. Please wait a few minutes and try again." };
  }

  const v = parsed.data;
  const phone = normalizePakistaniPhone(v.phone);
  if (!phone) return { ok: false, error: "Enter a valid Pakistani mobile number.", fieldErrors: { phone: ["Invalid number"] } };
  const user = await getUser();

  const { data, error } = await createAdminClient().rpc("create_order", {
    p_idempotency_key: v.idempotency_key,
    p_user_id: user?.id ?? null,
    p_customer: {
      full_name: v.full_name,
      phone,
      email: v.email || null,
      province: v.province,
      city: v.city,
      address: v.address,
      notes: v.notes || null,
    },
    p_items: v.items,
    p_payment_method: v.payment_method,
    p_coupon_code: v.coupon_code || null,
  });

  if (error || !data) {
    if (error && !/^(OUT_OF_STOCK|PRODUCT_UNAVAILABLE|COUPON_|EMPTY_CART|INVALID_|PAYMENT_METHOD|DELIVERY_NOT|TOO_MANY)/.test(error.message)) {
      console.error("[checkout]", error);
    }
    return { ok: false, error: orderErrorMessage(error?.message) };
  }

  const result = data as { order_number: string; access_token: string; duplicate: boolean };
  if (!result.duplicate) {
    // Stock changed — refresh cached catalog pages so stock badges stay accurate.
    revalidatePath("/", "layout");
  }
  return { ok: true, data: { orderNumber: result.order_number, token: result.access_token } };
}

// ---------------------------------------------------------------------------
// Order tracking (order number + phone; rate limited)
// ---------------------------------------------------------------------------
export interface TrackedOrder {
  order_number: string;
  created_at: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  city: string;
  total: number;
  first_name: string;
  items: { name: string; quantity: number }[];
  history: { status: OrderStatus; created_at: string }[];
}

export async function trackOrder(input: unknown): Promise<ActionResult<TrackedOrder>> {
  const parsed = trackOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!isServiceRoleConfigured()) return { ok: false, error: "Order tracking isn't available yet." };
  if (!(await rateLimit("track", 15, 600))) return { ok: false, error: "Too many lookups. Please try again in a few minutes." };

  const phone = normalizePakistaniPhone(parsed.data.phone)!;
  const { data, error } = await createAdminClient().rpc("track_order", { p_order_number: parsed.data.order_number, p_phone: phone });
  if (error) {
    console.error("[track]", error);
    return { ok: false, error: "Couldn't look up your order right now. Please try again." };
  }
  if (!data) {
    // Same message for "no such order" and "wrong phone" so numbers can't be probed.
    return { ok: false, error: "We couldn't find an order with that order number and phone number." };
  }
  return { ok: true, data: { ...(data as TrackedOrder), total: Number((data as TrackedOrder).total) } };
}
