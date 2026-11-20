"use server";
import { z } from "zod";
import { getProductsByIds } from "@/lib/data/catalog";
import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ProductSummary } from "@/types";

const idsSchema = z.array(z.uuid()).max(100);
const linesSchema = z.array(z.object({ productId: z.uuid(), quantity: z.number().int().min(1).max(50) })).max(50);

/** Fresh, server-side product data for cart/wishlist display. */
export async function getCartProducts(ids: string[]): Promise<ProductSummary[]> {
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return [];
  return getProductsByIds(parsed.data);
}

/** Signed-in users only: read the saved server cart. */
export async function loadServerCart(): Promise<{ productId: string; quantity: number }[] | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("carts")
    .select("id, cart_items(product_id, quantity)")
    .eq("user_id", user.id)
    .maybeSingle();
  return (data?.cart_items ?? []).map((i: { product_id: string; quantity: number }) => ({ productId: i.product_id, quantity: i.quantity }));
}

/** Signed-in users only: replace the saved server cart with the given lines. */
export async function saveServerCart(lines: { productId: string; quantity: number }[]): Promise<boolean> {
  const parsed = linesSchema.safeParse(lines);
  if (!parsed.success) return false;
  const user = await getUser();
  if (!user) return false;
  const supabase = await createClient();

  const { data: cart, error } = await supabase
    .from("carts")
    .upsert({ user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
    .select("id")
    .single();
  if (error || !cart) return false;

  await supabase.from("cart_items").delete().eq("cart_id", cart.id);
  if (parsed.data.length > 0) {
    const { error: insertError } = await supabase
      .from("cart_items")
      .insert(parsed.data.map((l) => ({ cart_id: cart.id, product_id: l.productId, quantity: l.quantity })));
    if (insertError) return false;
  }
  return true;
}
