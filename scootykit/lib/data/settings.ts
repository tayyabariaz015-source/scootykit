import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { toNullableNumber } from "@/lib/utils";
import type { DeliveryZone, StoreSettings } from "@/types";

export const DEFAULT_SETTINGS: StoreSettings = {
  store_name: "ScootyKit",
  tagline: "Everything Your Scooty Needs.",
  announcement_text: null,
  announcement_link: null,
  announcement_active: false,
  contact_email: null,
  contact_phone: null,
  whatsapp_number: null,
  business_address: null,
  business_hours: null,
  bank_transfer_enabled: false,
  bank_name: null,
  bank_account_title: null,
  bank_account_number: null,
  bank_iban: null,
  bank_instructions: null,
  cod_enabled: true,
  free_delivery_threshold: null,
  delivery_estimate_text: null,
  hero_image_url: null,
  social_facebook: null,
  social_instagram: null,
  social_tiktok: null,
};

export async function getStoreSettings(): Promise<StoreSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;
  const { data, error } = await createPublicClient().from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) {
    if (error) console.error("[settings]", error);
    return DEFAULT_SETTINGS;
  }
  return {
    ...DEFAULT_SETTINGS,
    ...data,
    free_delivery_threshold: toNullableNumber(data.free_delivery_threshold),
  } as StoreSettings;
}

export async function getActiveDeliveryZones(): Promise<DeliveryZone[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await createPublicClient()
    .from("delivery_zones")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []).map((z) => ({ ...z, charge: Number(z.charge) })) as DeliveryZone[];
}

/** Mirrors public.resolve_delivery_charge for display. The DB decides the charged amount. */
export function resolveDeliveryCharge(
  zones: DeliveryZone[],
  province: string,
  city: string,
  subtotal: number,
  freeThreshold: number | null,
): number | null {
  if (freeThreshold !== null && subtotal >= freeThreshold) return 0;
  const p = province.trim().toLowerCase();
  const c = city.trim().toLowerCase();
  const active = zones.filter((z) => z.is_active);
  const cityZone = active.find((z) => z.city && z.province && z.city.toLowerCase() === c && z.province.toLowerCase() === p);
  if (cityZone) return cityZone.charge;
  const provZone = active.find((z) => !z.city && z.province && z.province.toLowerCase() === p);
  if (provZone) return provZone.charge;
  const def = active.find((z) => !z.city && !z.province);
  return def ? def.charge : null;
}
