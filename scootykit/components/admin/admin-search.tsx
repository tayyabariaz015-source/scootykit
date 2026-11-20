import Form from "next/form";
import { Search } from "lucide-react";
import type { ReactNode } from "react";

/** GET filter bar for admin lists (works without JS). */
export function AdminFilterBar({ action, q, placeholder, children }: { action: string; q?: string; placeholder: string; children?: ReactNode }) {
  return (
    <Form action={action} className="mb-4 flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <label htmlFor="admin-q" className="sr-only">
          Search
        </label>
        <input
          id="admin-q"
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm focus:border-coral-500 focus:outline-none focus:ring-4 focus:ring-coral-500/10"
        />
      </div>
      {children}
      <button type="submit" className="h-11 rounded-xl bg-navy-900 px-5 text-sm font-semibold text-white hover:bg-navy-800">
        Filter
      </button>
    </Form>
  );
}

export const filterSelectClass = "h-11 rounded-xl border border-line bg-white px-3 text-sm focus:border-coral-500 focus:outline-none";
