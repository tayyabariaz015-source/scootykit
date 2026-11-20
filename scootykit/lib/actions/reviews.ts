"use server";
import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { reviewSchema } from "@/lib/validation/schemas";
import { fieldErrors } from "@/lib/validation/helpers";
import type { ActionResult } from "@/types";

export async function submitReview(input: unknown): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const user = await getUser();
  if (!user) return { ok: false, error: "Please sign in to write a review." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_review", {
    p_product_id: parsed.data.product_id,
    p_rating: parsed.data.rating,
    p_title: parsed.data.title,
    p_body: parsed.data.body,
  });
  if (error) {
    if (error.message.includes("NOT_VERIFIED_BUYER")) {
      return { ok: false, error: "Reviews are open to customers who have received this product." };
    }
    console.error("[review]", error);
    return { ok: false, error: "Couldn't submit your review. Please try again." };
  }
  return { ok: true, message: "Thanks! Your review will appear after a quick check by our team." };
}
