import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** Current verified user (validated with Supabase Auth, not just the cookie). */
export const getUser = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireUser(next = "/account") {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export const getIsAdmin = cache(async (): Promise<boolean> => {
  const user = await getUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    console.error("[auth:is_admin]", error);
    return false;
  }
  return data === true;
});

/**
 * Server-side admin gate for pages AND server actions. Hiding links is not
 * security — every admin page/action calls this, and RLS enforces it again in Postgres.
 */
export async function requireAdmin() {
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");
  if (!(await getIsAdmin())) redirect("/?error=forbidden");
  return user;
}

/** For server actions: returns an error string instead of redirecting. */
export async function assertAdmin(): Promise<{ userId: string } | { error: string }> {
  const user = await getUser();
  if (!user) return { error: "Please sign in again." };
  if (!(await getIsAdmin())) return { error: "You don't have permission to do that." };
  return { userId: user.id };
}
