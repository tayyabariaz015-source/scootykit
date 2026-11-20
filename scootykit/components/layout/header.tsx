"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Heart, LayoutGrid, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { CategoryIcon } from "@/components/ui/category-icon";
import { useCartCount } from "@/lib/client/cart-store";
import { useWishlist } from "@/lib/client/wishlist-store";
import { cn } from "@/lib/utils";

export interface NavCategory {
  name: string;
  slug: string;
  icon: string;
}

const NAV_LINKS = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop?sort=newest", label: "New Arrivals" },
  { href: "/shop?sort=popular", label: "Popular" },
  { href: "/track-order", label: "Track Order" },
  { href: "/faq", label: "Help" },
];

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-coral-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function SearchForm({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const id = useId();
  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
        router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        id={id}
        name="q"
        type="search"
        autoFocus={autoFocus}
        placeholder="Search helmets, locks, covers…"
        autoComplete="off"
        className="h-11 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-[15px] placeholder:text-muted/80 transition-colors focus:border-coral-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-coral-500/10"
      />
    </form>
  );
}

export function Header({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  const cartCount = useCartCount();
  const wishlistCount = useWishlist().length;
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);
  const megaId = useId();

  // Close menus on navigation
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setMegaOpen(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMegaOpen(false);
        setMenuOpen(false);
      }
    }
    function onClick(e: MouseEvent) {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const iconBtn = "relative grid h-10 w-10 place-items-center rounded-xl text-navy-900 transition-colors hover:bg-surface";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="container-page">
        <div className="flex h-16 items-center gap-3 lg:h-[72px] lg:gap-8">
          <button className={cn(iconBtn, "-ml-2 lg:hidden")} onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
            <Menu className="h-5.5 w-5.5" />
          </button>
          <Logo className="shrink-0" />
          <SearchForm className="hidden max-w-xl flex-1 md:block" />
          <nav aria-label="Account" className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <Link href="/account" className={iconBtn} aria-label="Account">
              <User className="h-5.5 w-5.5" />
            </Link>
            <Link href="/wishlist" className={iconBtn} aria-label={`Wishlist (${wishlistCount} items)`}>
              <Heart className="h-5.5 w-5.5" />
              <CountBadge count={wishlistCount} />
            </Link>
            <Link href="/cart" className={iconBtn} aria-label={`Cart (${cartCount} items)`}>
              <ShoppingBag className="h-5.5 w-5.5" />
              <CountBadge count={cartCount} />
            </Link>
          </nav>
        </div>
        <SearchForm className="pb-3 md:hidden" />

        {/* Desktop category navigation */}
        <div className="hidden h-12 items-center gap-1 lg:flex">
          <div ref={megaRef} className="relative">
            <button
              onClick={() => setMegaOpen((o) => !o)}
              aria-expanded={megaOpen}
              aria-controls={megaId}
              className={cn(
                "flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors",
                megaOpen ? "bg-navy-900 text-white" : "bg-surface text-navy-900 hover:bg-slate-100",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              All Categories
              <ChevronDown className={cn("h-4 w-4 transition-transform", megaOpen && "rotate-180")} />
            </button>
            {megaOpen && (
              <div
                id={megaId}
                className="absolute left-0 top-[calc(100%+10px)] w-[min(92vw,1040px)] animate-fade-up rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-lift)]"
              >
                <div className="grid grid-cols-3 gap-1 xl:grid-cols-4">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/category/${c.slug}`}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-800 transition-colors hover:bg-coral-50 hover:text-coral-700"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface text-navy-700 transition-colors group-hover:bg-white group-hover:text-coral-600">
                        <CategoryIcon name={c.icon} className="h-4 w-4" />
                      </span>
                      {c.name}
                    </Link>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm">
                  <span className="text-muted">{categories.length} categories</span>
                  <Link href="/categories" className="font-semibold text-coral-600 hover:underline">
                    Browse all categories →
                  </Link>
                </div>
              </div>
            )}
          </div>
          <nav aria-label="Main" className="flex items-center">
            {NAV_LINKS.map((l) => {
              const active = l.href === "/shop" ? pathname === "/shop" : pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-coral-600",
                    active ? "text-coral-600" : "text-navy-800",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-navy-950/50 backdrop-blur-[2px]" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <Logo />
              <button className={iconBtn} onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X className="h-5.5 w-5.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
              <nav aria-label="Mobile main" className="grid gap-0.5">
                {NAV_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} className="rounded-xl px-3 py-3 text-[15px] font-semibold hover:bg-surface">
                    {l.label}
                  </Link>
                ))}
              </nav>
              <p className="mb-2 mt-6 px-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">Categories</p>
              <nav aria-label="Mobile categories" className="grid gap-0.5">
                {categories.map((c) => (
                  <Link key={c.slug} href={`/category/${c.slug}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] hover:bg-surface">
                    <CategoryIcon name={c.icon} className="h-4.5 w-4.5 text-coral-500" />
                    {c.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-line p-4">
              <Link href="/account" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold">
                <User className="h-4 w-4" /> Account
              </Link>
              <Link href="/cart" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-navy-900 text-sm font-semibold text-white">
                <ShoppingBag className="h-4 w-4" /> Cart ({cartCount})
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
