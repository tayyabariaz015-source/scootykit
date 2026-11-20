"use client";
import Link from "next/link";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { dismissToast, useToasts } from "@/lib/client/toast-store";

export function Toaster() {
  const toasts = useToasts();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6">
      {toasts.map((t) => {
        const Icon = t.tone === "error" ? XCircle : t.tone === "info" ? Info : CheckCircle2;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-lift)]"
          >
            <Icon className={t.tone === "error" ? "h-5 w-5 shrink-0 text-red-600" : "h-5 w-5 shrink-0 text-emerald-600"} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy-900">{t.title}</p>
              {t.description && <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{t.description}</p>}
              {t.action && (
                <Link href={t.action.href} onClick={() => dismissToast(t.id)} className="mt-2 inline-block text-sm font-semibold text-coral-600 hover:underline">
                  {t.action.label}
                </Link>
              )}
            </div>
            <button onClick={() => dismissToast(t.id)} className="rounded-lg p-1 text-muted hover:bg-surface hover:text-navy-900" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
