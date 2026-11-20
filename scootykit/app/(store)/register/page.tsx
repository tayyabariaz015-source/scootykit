import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/forms";
import { getUser } from "@/lib/auth/session";

// Depends on the signed-in user — never prerender.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Create Account", robots: { index: false } };

export default async function RegisterPage() {
  if (await getUser()) redirect("/account");
  return (
    <AuthCard
      title="Create your account"
      description="Faster checkout, order history and a saved wishlist."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-coral-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
