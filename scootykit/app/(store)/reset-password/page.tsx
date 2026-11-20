import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/forms";
import { ButtonLink } from "@/components/ui/button";
import { getUser } from "@/lib/auth/session";

// Depends on the signed-in user — never prerender.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Set New Password", robots: { index: false } };

export default async function ResetPasswordPage() {
  const user = await getUser();
  return (
    <AuthCard title="Set a new password" description={user ? `For ${user.email}` : undefined}>
      {user ? (
        <ResetPasswordForm />
      ) : (
        <div className="space-y-4 text-sm text-muted">
          <p>Your reset link has expired or is invalid. Request a new one to continue.</p>
          <ButtonLink href="/forgot-password" className="w-full">
            Request new link
          </ButtonLink>
        </div>
      )}
    </AuthCard>
  );
}
