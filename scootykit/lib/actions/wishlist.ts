"use server";
import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** Merges guest wishlist ids into the account and returns the full saved list. */
export async function syncWishlist(localIds: string[]): Promise<string[] | null> {
  const user = await getUser();
  if (!user) return null;
  const ids = z.array(z.uuid()).max(200).safeParse(localIds);
  const supabase = await createClient();
  if (ids.success && ids.data.length > 0) {
    await supabase
      .from("wishlists")
      .upsert(ids.data.map((product_id) => ({ user_id: user.id, product_id })), { onConflict: "user_id,product_id", ignoreDuplicates: true });
  }
  const { data } = await supabase.from("wishlists").select("product_id").eq("user_id", user.id).order("created_at", { ascending: false });
  return (data ?? []).map((r) => r.product_id as string);
}

export async function setWishlisted(productId: string, wishlisted: boolean): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;
  if (!z.uuid().safeParse(productId).success) return false;
  const supabase = await createClient();
  const { error } = wishlisted
    ? await supabase.from("wishlists").upsert({ user_id: user.id, product_id: productId }, { onConflict: "user_id,product_id", ignoreDuplicates: true })
    : await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
  return !error;
}
