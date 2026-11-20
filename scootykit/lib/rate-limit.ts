import "server-only";
import { headers } from "next/headers";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("cf-connecting-ip") ||
    "unknown"
  );
}

/**
 * Postgres-backed fixed-window rate limit (works across serverless instances).
 * Fails OPEN if the limiter itself errors so a DB hiccup doesn't block sales,
 * but logs loudly.
 */
export async function rateLimit(bucket: string, max: number, windowSeconds: number): Promise<boolean> {
  if (!isServiceRoleConfigured()) return true;
  const ip = await getClientIp();
  const { data, error } = await createAdminClient().rpc("check_rate_limit", {
    p_key: `${bucket}:${ip}`,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit]", error);
    return true;
  }
  return data === true;
}
