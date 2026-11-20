"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { normalizePakistaniPhone } from "@/lib/commerce/phone";
import { createClient } from "@/lib/supabase/server";
import { addressSchema, profileSchema } from "@/lib/validation/schemas";
import { fieldErrors } from "@/lib/validation/helpers";
import type { ActionResult } from "@/types";

export async function updateProfile(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const user = await getUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone ? normalizePakistaniPhone(parsed.data.phone) : null })
    .eq("id", user.id);
  if (error) return { ok: false, error: "Couldn't save your profile." };
  revalidatePath("/account");
  return { ok: true, message: "Profile updated." };
}

export async function saveAddress(id: string | null, input: unknown): Promise<ActionResult> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (id !== null && !z.uuid().safeParse(id).success) return { ok: false, error: "Invalid address." };
  const user = await getUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const supabase = await createClient();

  const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if (id === null && (count ?? 0) >= 10) return { ok: false, error: "You can save up to 10 addresses." };

  const v = parsed.data;
  const makeDefault = v.is_default || (count ?? 0) === 0;
  if (makeDefault) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id).eq("is_default", true);
  }
  const row = {
    user_id: user.id,
    label: v.label,
    full_name: v.full_name,
    phone: normalizePakistaniPhone(v.phone)!,
    province: v.province,
    city: v.city,
    address_line: v.address_line,
    is_default: makeDefault,
  };
  const { error } = id ? await supabase.from("addresses").update(row).eq("id", id).eq("user_id", user.id) : await supabase.from("addresses").insert(row);
  if (error) return { ok: false, error: "Couldn't save the address." };
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address saved." };
}

export async function deleteAddress(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Invalid address." };
  const user = await getUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const supabase = await createClient();
  const { error } = await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, error: "Couldn't delete the address." };
  revalidatePath("/account/addresses");
  return { ok: true };
}
