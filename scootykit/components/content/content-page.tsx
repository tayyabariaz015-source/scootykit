import type { ReactNode } from "react";
import { FileWarning } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/misc";

export function ContentPage({ title, intro, updated, draft, children }: { title: string; intro?: string; updated?: string; draft?: boolean; children: ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <Breadcrumbs items={[{ label: title }]} />
      <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{title}</h1>
      {intro && <p className="mt-3 text-lg text-muted">{intro}</p>}
      {updated && <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>}
      {draft && (
        <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="note">
          <FileWarning className="h-5 w-5 shrink-0" />
          <p>
            <strong>Draft policy — editable.</strong> Text in [square brackets] must be replaced with ScootyKit&apos;s real business details, and the policy should be reviewed
            before launch. Edit this page in <code className="rounded bg-amber-100 px-1">app/(store)</code>.
          </p>
        </div>
      )}
      <div className="prose-sk mt-8">{children}</div>
    </div>
  );
}
