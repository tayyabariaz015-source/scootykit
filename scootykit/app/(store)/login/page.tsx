import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/forms";
import { getUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/redirect";
import { firstParam } from "@/lib/utils";

// Depends on the signed-in user — never prerender.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign In", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNext(firstParam(sp.next));
  if (await getUser()) redirect(next);
  const notice = firstParam(sp.error) === "link_expired" ? "That link has expired or was already used. Please try again." : undefined;
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to track orders, save addresses and sync your cart."
      footer={
        <>
          New to ScootyKit?{" "}
          <Link href={`/register${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-coral-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={next} notice={notice} />
    </AuthCard>
  );
}
