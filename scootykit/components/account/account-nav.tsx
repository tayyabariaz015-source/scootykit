"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, Shield } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: "/account", label: "Dashboard", icon: LayoutDashboard },
    { href: "/account/orders", label: "Order history", icon: Package },
    { href: "/account/addresses", label: "Saved addresses", icon: MapPin },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
    ...(isAdmin ? [{ href: "/admin", label: "Admin dashboard", icon: Shield }] : []),
  ];
  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto lg:flex-col">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/account" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-surface",
            )}
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </Link>
        );
      })}
      <form action={signOut}>
        <button type="submit" className="flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 lg:w-full">
          <LogOut className="h-4.5 w-4.5" />
          Sign out
        </button>
      </form>
    </nav>
  );
}
