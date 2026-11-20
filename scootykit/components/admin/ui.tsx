import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && (
          <Link href={back.href} className="mb-2 inline-block text-sm font-medium text-muted hover:text-navy-900">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, actions, children, className, bodyClassName }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-white", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          {title && <h2 className="text-base font-bold">{title}</h2>}
          {actions}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "navy", href, hint }: { label: string; value: ReactNode; icon: ComponentType<{ className?: string }>; tone?: "navy" | "coral" | "amber" | "emerald"; href?: string; hint?: string }) {
  const tones = {
    navy: "bg-navy-900/5 text-navy-900",
    coral: "bg-coral-50 text-coral-600",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  const body = (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-[var(--shadow-card)]">
      <div>
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-2 font-display text-2xl font-extrabold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
      <span className={cn("grid h-10 w-10 place-items-center rounded-xl", tones[tone])}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn("border-b border-line bg-surface/70 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("border-b border-line px-4 py-3 align-middle", className)}>{children}</td>;
}

export function FormMessage({ state }: { state: { ok: boolean; error?: string; message?: string } | null }) {
  if (!state) return null;
  if (state.ok && !state.message) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={cn("rounded-xl px-3.5 py-2.5 text-sm font-medium", state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>
      {state.ok ? state.message : state.error}
    </p>
  );
}
