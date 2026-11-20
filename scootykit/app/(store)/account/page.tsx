import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MapPin, Package } from "lucide-react";
import { OrderList } from "@/components/account/order-list";
import { ProfileForm } from "@/components/account/profile-form";
import { Alert, Card } from "@/components/ui/misc";
import { getAddresses, getMyOrders, getProfile } from "@/lib/data/account";
import { firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const [profile, orders, addresses] = await Promise.all([getProfile(), getMyOrders(), getAddresses()]);
  const passwordUpdated = firstParam((await searchParams).password) === "updated";
  const firstName = profile?.full_name.split(" ")[0] || "there";
  const stats = [
    { href: "/account/orders", label: "Orders", value: orders.length, icon: Package },
    { href: "/account/addresses", label: "Saved addresses", value: addresses.length, icon: MapPin },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Hi, {firstName}</h1>
        <p className="mt-1 text-muted">Manage your orders, addresses and profile.</p>
      </div>
      {passwordUpdated && <Alert tone="success">Your password has been updated.</Alert>}
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ href, label, value, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-4 rounded-2xl border border-line p-5 hover:border-coral-200 hover:shadow-[var(--shadow-card)]">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-coral-50 text-coral-600">
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-display text-2xl font-extrabold">{value}</span>
              <span className="text-sm text-muted">{label}</span>
            </span>
          </Link>
        ))}
        <Link href="/wishlist" className="flex items-center gap-4 rounded-2xl border border-line p-5 hover:border-coral-200 hover:shadow-[var(--shadow-card)]">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-coral-50 text-coral-600">
            <Heart className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold">View wishlist</span>
        </Link>
      </div>
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold">Recent orders</h2>
          {orders.length > 3 && (
            <Link href="/account/orders" className="text-sm font-semibold text-coral-600 hover:underline">
              View all
            </Link>
          )}
        </div>
        <OrderList orders={orders.slice(0, 3)} />
      </section>
      <Card className="p-5 sm:p-6">
        <h2 className="mb-5 text-xl font-bold">Profile</h2>
        {profile && <ProfileForm defaults={{ full_name: profile.full_name, phone: profile.phone }} email={profile.email} />}
      </Card>
    </div>
  );
}
