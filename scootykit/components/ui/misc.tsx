import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "warning" | "success" | "danger" | "coral";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  coral: "bg-coral-50 text-coral-700 ring-coral-200",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-[var(--radius-card)] border border-line bg-white shadow-[var(--shadow-card)]", className)}>{children}</div>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-14 text-center", className)}>
      {Icon && (
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-coral-500 shadow-[var(--shadow-card)]">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "success" | "danger";
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    danger: "border-red-200 bg-red-50 text-red-900",
  }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm", styles, className)}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div>}
    </div>
  );
}

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-muted">
        <li>
          <Link href="/" className="flex items-center rounded p-0.5 hover:text-navy-900" aria-label="Home">
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="hover:text-navy-900">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-navy-900 line-clamp-1">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow && <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.14em] text-coral-600">{eyebrow}</p>}
        <h2 className="text-2xl font-extrabold sm:text-[1.9rem]">{title}</h2>
        {description && <p className="mt-1.5 max-w-xl text-[15px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-8">
      {children}
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-[15px] text-muted">{description}</p>}
    </div>
  );
}
