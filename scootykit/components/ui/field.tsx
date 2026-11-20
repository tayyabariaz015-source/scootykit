import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClasses =
  "block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-navy-900 placeholder:text-muted/70 transition-colors hover:border-navy-900/25 focus:border-coral-500 focus:outline-none focus:ring-4 focus:ring-coral-500/10 disabled:cursor-not-allowed disabled:bg-surface aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/10";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-semibold text-navy-900", className)} {...props} />;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClasses, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputClasses, "min-h-24", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        inputClasses,
        "h-11 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%2364748B%22><path d=%22M5.5 7.5 10 12l4.5-4.5%22 stroke=%22%2364748B%22 stroke-width=%221.6%22 fill=%22none%22 stroke-linecap=%22round%22/></svg>')] bg-[length:18px] bg-[right_0.8rem_center] bg-no-repeat pr-10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[13px] font-medium text-red-600">
      {message}
    </p>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-[13px] text-muted">{children}</p>;
}

/** Label + control + error/hint wrapper. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-coral-600" aria-hidden="true">*</span>}
      </Label>
      {children}
      {error ? <FieldError id={`${htmlFor}-error`} message={error} /> : hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}

export function Checkbox({ label, className, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-sm text-navy-900", className)}>
      <input type="checkbox" className="mt-0.5 h-4.5 w-4.5 shrink-0 rounded border-line accent-coral-500" {...props} />
      <span>{label}</span>
    </label>
  );
}
