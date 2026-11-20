import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CreditCard, PackageSearch, ShieldCheck, Star, Wallet } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { SectionHeading } from "@/components/ui/misc";
import { ProductGrid } from "@/components/products/product-card";
import { formatDate } from "@/lib/utils";
import type { Category, ProductSummary, Review, StoreSettings } from "@/types";
import { HeroIllustration } from "./hero-illustration";

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
const HERO_CHIPS = [
  { slug: "scooty-helmets", label: "Helmets", icon: "hard-hat", pos: "left-[0%] top-[2%]" },
  { slug: "anti-theft-disc-locks", label: "Disc Locks", icon: "lock", pos: "right-[0%] top-[-4%]" },
  { slug: "scooty-mobile-holders", label: "Mobile Holders", icon: "smartphone", pos: "left-[0%] bottom-[-6%]" },
  { slug: "gps-trackers", label: "GPS Trackers", icon: "map-pin", pos: "right-[0%] bottom-[-6%]" },
];

export function Hero({ settings }: { settings: StoreSettings }) {
  const perks = [
    settings.cod_enabled && { icon: Wallet, label: "Cash on Delivery" },
    { icon: ShieldCheck, label: "Secure checkout" },
    { icon: PackageSearch, label: "Easy order tracking" },
  ].filter(Boolean) as { icon: typeof Wallet; label: string }[];

  return (
    <section className="relative overflow-hidden bg-navy-900">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 70% 40%, black, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:py-24">
        <div className="animate-fade-up">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-coral-500" />
            Accessories for electric scooty &amp; scooter riders
          </p>
          <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl lg:text-[4.1rem]">
            Everything Your <span className="text-coral-500">Scooty</span> Needs.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-300">Discover quality accessories designed for your ride.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/shop" size="lg">
              Shop Now <ArrowRight className="h-4.5 w-4.5" />
            </ButtonLink>
            <ButtonLink href="/categories" size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10">
              Explore Categories
            </ButtonLink>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {perks.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Icon className="h-4.5 w-4.5 text-coral-500" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          {settings.hero_image_url ? (
            <div className="relative aspect-[10/7] overflow-hidden rounded-3xl">
              <Image src={settings.hero_image_url} alt="Electric scooty with ScootyKit accessories" fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
          ) : (
            <HeroIllustration className="h-auto w-full" />
          )}
          {HERO_CHIPS.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className={`absolute ${c.pos} hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/95 px-3 py-2 text-[13px] font-semibold text-navy-900 shadow-lg backdrop-blur transition-transform hover:-translate-y-0.5 sm:flex`}
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-coral-50 text-coral-600">
                <CategoryIcon name={c.icon} className="h-4 w-4" />
              </span>
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Featured categories (large tiles)
// ---------------------------------------------------------------------------
const FEATURED_SLUGS = [
  { slug: "scooty-helmets", blurb: "Ride safer, every day" },
  { slug: "anti-theft-disc-locks", blurb: "Park with peace of mind" },
  { slug: "scooty-mobile-holders", blurb: "Navigate hands-free" },
  { slug: "riding-raincoats", blurb: "Ready for monsoon rides" },
];

export function FeaturedCategories({ categories }: { categories: Category[] }) {
  const featured = FEATURED_SLUGS.map((f) => {
    const c = categories.find((x) => x.slug === f.slug);
    return c ? { ...c, blurb: f.blurb } : null;
  }).filter((c): c is Category & { blurb: string } => c !== null);
  if (featured.length === 0) return null;

  return (
    <section className="container-page pt-16 sm:pt-20">
      <SectionHeading eyebrow="Featured categories" title="Built around your daily ride" />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {featured.map((c, i) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className={`group relative flex min-h-44 flex-col justify-between overflow-hidden rounded-3xl p-5 transition-transform hover:-translate-y-1 sm:min-h-56 sm:p-6 ${
              i === 0 ? "bg-coral-500 text-white" : i === 1 ? "bg-navy-900 text-white" : "bg-surface text-navy-900 ring-1 ring-line"
            }`}
          >
            {c.image_url ? (
              <Image src={c.image_url} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover opacity-30 transition-opacity group-hover:opacity-40" />
            ) : null}
            <span
              className={`relative grid h-12 w-12 place-items-center rounded-2xl ${
                i < 2 ? "bg-white/15 text-white" : "bg-white text-coral-600 shadow-[var(--shadow-card)]"
              }`}
            >
              <CategoryIcon name={c.icon} className="h-6 w-6" />
            </span>
            <div className="relative">
              <h3 className={`text-lg font-bold sm:text-xl ${i < 2 ? "text-white" : ""}`}>{c.name}</h3>
              <p className={`mt-1 text-sm ${i < 2 ? "text-white/80" : "text-muted"}`}>{c.blurb}</p>
              <span className={`mt-3 inline-flex items-center gap-1 text-sm font-semibold ${i < 2 ? "text-white" : "text-coral-600"}`}>
                Shop now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// All categories grid
// ---------------------------------------------------------------------------
export function CategoryGrid({ categories, compact }: { categories: Category[]; compact?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/category/${c.slug}`}
          className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-3 transition-[border-color,box-shadow] hover:border-coral-200 hover:shadow-[var(--shadow-card)] sm:p-3.5"
        >
          <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface text-navy-700 transition-colors group-hover:bg-coral-50 group-hover:text-coral-600">
            {c.image_url ? <Image src={c.image_url} alt="" fill sizes="44px" className="object-cover" /> : <CategoryIcon name={c.icon} className="h-5 w-5" />}
          </span>
          <span className="min-w-0">
            <span className="line-clamp-2 text-[13.5px] font-semibold leading-tight text-navy-900">{c.name}</span>
            {!compact && (
              <span className="mt-0.5 block text-xs text-muted">
                {c.product_count ?? 0} {(c.product_count ?? 0) === 1 ? "product" : "products"}
              </span>
            )}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function ShopByCategory({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="container-page pt-16 sm:pt-20">
      <SectionHeading
        eyebrow="Shop by category"
        title={`${categories.length} categories for every rider`}
        action={
          <Link href="/categories" className="inline-flex items-center gap-1 text-sm font-semibold text-coral-600 hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <CategoryGrid categories={categories} />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Product rails
// ---------------------------------------------------------------------------
export function ProductRail({
  eyebrow,
  title,
  products,
  href,
  tone = "white",
}: {
  eyebrow: string;
  title: string;
  products: ProductSummary[];
  href: string;
  tone?: "white" | "surface";
}) {
  if (products.length === 0) return null;
  return (
    <section className={tone === "surface" ? "mt-16 bg-surface py-16 sm:mt-20" : "container-page pt-16 sm:pt-20"}>
      <div className={tone === "surface" ? "container-page" : undefined}>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          action={
            <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-coral-600 hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <ProductGrid products={products.slice(0, 8)} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Why choose
// ---------------------------------------------------------------------------
export function WhyChoose({ settings }: { settings: StoreSettings }) {
  const payment =
    settings.cod_enabled && settings.bank_transfer_enabled
      ? "Pay with Cash on Delivery or bank transfer — whatever suits you."
      : settings.cod_enabled
        ? "Pay with Cash on Delivery when your order arrives."
        : "Simple, secure payment options at checkout.";
  const items = [
    { icon: BadgeCheck, title: "Curated for riders", text: "Every category is chosen around the real needs of daily scooty and scooter riders." },
    { icon: CreditCard, title: "Pay your way", text: payment },
    { icon: PackageSearch, title: "Track every order", text: "Check your order status anytime with your order number and phone." },
    { icon: ShieldCheck, title: "Live prices & stock", text: "Prices in PKR and stock levels on every product are always up to date." },
  ];
  return (
    <section className="container-page pt-16 sm:pt-20">
      <div className="rounded-3xl border border-line bg-gradient-to-b from-white to-surface p-6 sm:p-10">
        <SectionHeading eyebrow="Why ScootyKit" title="Why riders choose ScootyKit" className="mb-8" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-coral-600 shadow-[var(--shadow-card)] ring-1 ring-line">
                <Icon className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-4 text-base font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Reviews (approved, real only — section hidden when none)
// ---------------------------------------------------------------------------
export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ""}`} aria-label={`${rating} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} aria-hidden="true" />
      ))}
    </span>
  );
}

export function CustomerReviews({ reviews }: { reviews: (Review & { product: { name: string; slug: string } | null })[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="container-page pt-16 sm:pt-20">
      <SectionHeading eyebrow="Verified buyers" title="What customers are saying" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <figure key={r.id} className="flex flex-col rounded-2xl border border-line bg-white p-6">
            <Stars rating={r.rating} />
            {r.title && <p className="mt-3 font-semibold">{r.title}</p>}
            <blockquote className="mt-2 line-clamp-5 flex-1 text-[15px] leading-7 text-navy-700">“{r.body}”</blockquote>
            <figcaption className="mt-4 border-t border-line pt-4 text-sm">
              <span className="font-semibold">{r.author_name}</span>
              <span className="text-muted"> · {formatDate(r.created_at)}</span>
              {r.product && (
                <Link href={`/product/${r.product.slug}`} className="mt-0.5 block truncate text-coral-600 hover:underline">
                  {r.product.name}
                </Link>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
