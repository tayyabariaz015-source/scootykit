import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { formatPhone } from "@/lib/commerce/phone";
import type { Category, StoreSettings } from "@/types";

const HELP_LINKS = [
  { href: "/track-order", label: "Track Your Order" },
  { href: "/faq", label: "FAQ" },
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/returns", label: "Returns & Exchanges" },
  { href: "/contact", label: "Contact Us" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About ScootyKit" },
  { href: "/shop", label: "Shop All" },
  { href: "/categories", label: "All Categories" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

export function Footer({ settings, categories }: { settings: StoreSettings; categories: Category[] }) {
  const socials = [
    { href: settings.social_facebook, label: "Facebook" },
    { href: settings.social_instagram, label: "Instagram" },
    { href: settings.social_tiktok, label: "TikTok" },
  ].filter((s): s is { href: string; label: string } => Boolean(s.href));

  return (
    <footer className="mt-auto bg-navy-900 text-slate-300">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo inverted />
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
            {settings.tagline} Quality accessories for electric scooty, scooter and motorcycle riders across Pakistan.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {settings.contact_phone && (
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-coral-500" />
                <a href={`tel:${settings.contact_phone}`} className="hover:text-white">
                  {formatPhone(settings.contact_phone)}
                </a>
              </li>
            )}
            {settings.contact_email && (
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-coral-500" />
                <a href={`mailto:${settings.contact_email}`} className="hover:text-white">
                  {settings.contact_email}
                </a>
              </li>
            )}
            {settings.business_address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
                <span>{settings.business_address}</span>
              </li>
            )}
          </ul>
          {socials.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:border-coral-500 hover:text-coral-500"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {categories.length > 0 && (
          <FooterColumn title="Popular categories">
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </FooterColumn>
        )}
        <FooterColumn title="Customer care">
          {HELP_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            </li>
          ))}
        </FooterColumn>
        <FooterColumn title="ScootyKit">
          {COMPANY_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            </li>
          ))}
        </FooterColumn>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} ScootyKit. All rights reserved.</p>
          <p>Prices in Pakistani Rupees (PKR)</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-white">{title}</h2>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}
