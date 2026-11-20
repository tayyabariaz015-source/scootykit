import { AccountNav } from "@/components/account/account-nav";
import { getIsAdmin, requireUser } from "@/lib/auth/session";

// Depends on the signed-in user — never prerender.
export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  await requireUser("/account");
  const isAdmin = await getIsAdmin();
  return (
    <div className="container-page grid gap-8 py-8 sm:py-12 lg:grid-cols-[230px_1fr]">
      <aside>
        <AccountNav isAdmin={isAdmin} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
