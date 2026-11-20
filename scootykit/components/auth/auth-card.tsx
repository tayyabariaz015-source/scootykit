import type { ReactNode } from "react";
import { LogoMark } from "@/components/ui/logo";

export function AuthCard({ title, description, children, footer }: { title: string; description?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="container-page flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-line bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
          <LogoMark className="h-11 w-11" />
          <h1 className="mt-5 text-2xl font-extrabold">{title}</h1>
          {description && <p className="mt-1.5 text-[15px] text-muted">{description}</p>}
          <div className="mt-7">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}
