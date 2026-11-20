"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { safeNext } from "@/lib/auth/redirect";
import { normalizePakistaniPhone } from "@/lib/commerce/phone";
import { isSupabaseConfigured, SITE_URL } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validation/schemas";
import { fieldErrors } from "@/lib/validation/helpers";
import type { ActionResult } from "@/types";

const NOT_CONFIGURED: ActionResult<never> = { ok: false, error: "Accounts aren't available yet. Please try again later." };

export async function login(input: unknown, next?: string): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  if (!(await rateLimit("login", 10, 600))) return { ok: false, error: "Too many sign-in attempts. Please wait a few minutes." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") return { ok: false, error: "Please confirm your email first — check your inbox for the link." };
    return { ok: false, error: "Incorrect email or password." };
  }
  revalidatePath("/", "layout");
  return { ok: true, data: { redirectTo: safeNext(next) } };
}

export async function register(input: unknown): Promise<ActionResult<{ redirectTo?: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  if (!(await rateLimit("register", 5, 3600))) return { ok: false, error: "Too many sign-up attempts. Please try again later." };

  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: v.email,
    password: v.password,
    options: {
      data: { full_name: v.full_name, phone: v.phone ? normalizePakistaniPhone(v.phone) : null },
      emailRedirectTo: `${SITE_URL}/auth/confirm?next=/account`,
    },
  });
  if (error) {
    if (error.code === "weak_password") return { ok: false, error: "Please choose a stronger password." };
    if (error.code === "user_already_exists") return { ok: false, error: "An account with this email already exists. Try signing in." };
    console.error("[register]", error.code, error.message);
    return { ok: false, error: "Couldn't create your account. Please try again." };
  }
  if (data.session) {
    revalidatePath("/", "layout");
    return { ok: true, data: { redirectTo: "/account" } };
  }
  return { ok: true, message: "Almost done! We've sent a confirmation link to your email. Open it to activate your account." };
}

export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid email address.", fieldErrors: fieldErrors(parsed.error) };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  if (!(await rateLimit("reset", 5, 3600))) return { ok: false, error: "Too many requests. Please try again later." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/auth/confirm?next=/reset-password`,
  });
  if (error) console.error("[reset]", error.code, error.message);
  // Same response either way — don't reveal which emails have accounts.
  return { ok: true, message: "If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder)." };
}

export async function updatePassword(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your reset link has expired. Please request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { ok: false, error: "Choose a password different from your current one." };
    return { ok: false, error: "Couldn't update your password. Please try again." };
  }
  return { ok: true, data: { redirectTo: "/account?password=updated" } };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}
