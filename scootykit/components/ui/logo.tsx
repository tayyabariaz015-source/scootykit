import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={cn("h-9 w-9 shrink-0", className)}>
      <rect width="48" height="48" rx="12" fill={inverted ? "#FFFFFF" : "#111827"} />
      <path
        transform="translate(4.2 0) skewX(-8)"
        d="M29.5 14.2C27.8 12.6 25.6 11.8 23 11.8c-5 0-8.2 2.9-8.2 6.7 0 4.3 3.7 5.7 8.7 6.6 5.2.9 9 2.6 9 7 0 4-3.6 6.9-9.1 6.9-3.3 0-6.1-1-8.2-3"
        fill="none"
        stroke={inverted ? "#111827" : "#FFFFFF"}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="35.4" cy="12.6" r="3.4" fill="#F43F5E" />
    </svg>
  );
}

export function Logo({ inverted = false, className, href = "/" }: { inverted?: boolean; className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5 rounded-lg", className)} aria-label="ScootyKit home">
      <LogoMark inverted={inverted} />
      <span
        className={cn(
          "font-display text-[1.35rem] font-extrabold leading-none tracking-[-0.03em]",
          inverted ? "text-white" : "text-navy-900",
        )}
      >
        Scooty<span className="text-coral-500">Kit</span>
      </span>
    </Link>
  );
}
