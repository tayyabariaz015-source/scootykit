import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin | ScootyKit" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Server-side authorization. RLS enforces the same rule again in Postgres.
  const user = await requireAdmin();
  return (
    <div className="min-h-screen bg-surface">
      <AdminSidebar email={user.email ?? ""} />
      <main id="main" className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
