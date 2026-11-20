import { Check, X } from "lucide-react";
import { ORDER_STATUS_LABEL, PROGRESS_STEPS } from "@/lib/commerce/status";
import { cn, formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/types";

export function OrderTimeline({ status, history }: { status: OrderStatus; history: { status: OrderStatus; created_at: string }[] }) {
  if (status === "cancelled") {
    const when = [...history].reverse().find((h) => h.status === "cancelled");
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-800">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-red-100">
          <X className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="font-semibold">This order was cancelled</p>
          {when && <p className="text-sm opacity-80">{formatDate(when.created_at, true)}</p>}
        </div>
      </div>
    );
  }
  const currentIdx = PROGRESS_STEPS.indexOf(status);
  return (
    <ol className="grid gap-0 sm:grid-cols-5" aria-label="Order progress">
      {PROGRESS_STEPS.map((s, i) => {
        const done = i <= currentIdx;
        const at = history.find((h) => h.status === s);
        return (
          <li key={s} className="relative flex gap-3 pb-5 sm:flex-col sm:items-center sm:pb-0 sm:text-center">
            {i < PROGRESS_STEPS.length - 1 && (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 sm:left-[calc(50%+18px)] sm:top-[15px] sm:h-0.5 sm:w-[calc(100%-36px)]",
                  i < currentIdx ? "bg-coral-500" : "bg-line",
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                done ? "bg-coral-500 text-white" : "border-2 border-line bg-white text-muted",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <div className="sm:mt-2">
              <p className={cn("text-sm font-semibold", done ? "text-navy-900" : "text-muted")}>
                {ORDER_STATUS_LABEL[s]}
                {i === currentIdx && <span className="sr-only"> (current)</span>}
              </p>
              {at && <p className="text-xs text-muted">{formatDate(at.created_at, true)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
