"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Boxes,
  FolderTree,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Truck,
  Upload,
  Users,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    label: "Overview",
    links: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    links: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/products/import", label: "Import products", icon: Upload },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes },
    ],
  },
  {
    label: "Sales",
    links: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/coupons", label: "Coupons", icon: Tag },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Store",
    links: [
      { href: "/admin/delivery", label: "Delivery charges", icon: Truck },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
      { href: "/admin/messages", label: "Messages", icon: MessageSquare },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/products") return pathname === "/admin/products" || /^\/admin\/products\/(?!import)/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-6">
      {GROUPS.map((g) => (
        <div key={g.label}>
          <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{g.label}</p>
          <ul className="space-y-0.5">
            {g.links.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className={cn("h-4.5 w-4.5", active && "text-coral-500")} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const brand = (
    <Link href="/admin" className="flex items-center gap-2.5">
      <LogoMark inverted className="h-8 w-8" />
      <span className="font-display text-lg font-extrabold text-white">
        Scooty<span className="text-coral-500">Kit</span> <span className="text-xs font-semibold text-slate-400">Admin</span>
      </span>
    </Link>
  );
  const footer = (
    <div className="border-t border-white/10 pt-4">
      <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
        <Store className="h-4 w-4" /> View store
      </Link>
      <p className="mt-2 truncate px-3 text-xs text-slate-500">{email}</p>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between bg-navy-900 px-4 lg:hidden">
        {brand}
        <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg text-white hover:bg-white/10" aria-label="Open admin menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-6 overflow-y-auto bg-navy-900 p-4 lg:flex">
        {brand}
        <div className="flex-1">
          <NavLinks />
        </div>
        {footer}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col gap-6 overflow-y-auto bg-navy-900 p-4">
            <div className="flex items-center justify-between">
              {brand}
              <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-white hover:bg-white/10" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            {footer}
          </aside>
        </div>
      )}
    </>
  );
}
