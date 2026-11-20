import "server-only";
import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/utils";
import type { Address, Order } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getProfile() {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("full_name, phone, email, created_at").eq("id", user.id).maybeSingle();
  return {
    id: user.id,
    email: user.email ?? data?.email ?? "",
    full_name: data?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "",
    phone: data?.phone ?? "",
    created_at: data?.created_at ?? user.created_at,
  };
}

export async function getAddresses(): Promise<Address[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("addresses")
    .select("id,label,full_name,phone,province,city,address_line,is_default")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as Address[];
}

export function mapOrder(row: any): Order {
  return {
    ...row,
    subtotal: toNumber(row.subtotal),
    delivery_charge: toNumber(row.delivery_charge),
    discount: toNumber(row.discount),
    total: toNumber(row.total),
    items: (row.items ?? row.order_items ?? []).map((i: any) => ({
      ...i,
      unit_price: toNumber(i.unit_price),
      line_total: toNumber(i.line_total),
    })),
    history: [...(row.history ?? row.order_status_history ?? [])].sort((a: any, b: any) => a.created_at.localeCompare(b.created_at)),
  };
}

export async function getMyOrders(): Promise<Order[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []).map(mapOrder);
}
