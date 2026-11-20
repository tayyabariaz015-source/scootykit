import { formatPKR } from "@/lib/commerce/format";

export function SalesChart({ data }: { data: { day: string; orders: number; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 0);
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);
  const label = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-PK", { day: "numeric", month: "short" });
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-x-8 gap-y-2">
        <div>
          <p className="text-xs font-medium text-muted">Order value (excl. cancelled)</p>
          <p className="font-display text-xl font-extrabold">{formatPKR(totalRevenue)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Orders placed</p>
          <p className="font-display text-xl font-extrabold">{totalOrders}</p>
        </div>
      </div>
      {max === 0 ? (
        <div className="grid h-44 place-items-center rounded-xl bg-surface text-sm text-muted">No orders in this period yet.</div>
      ) : (
        <div className="flex h-44 items-end gap-[3px]" role="img" aria-label={`Daily order value for the last ${data.length} days`}>
          {data.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t-[3px] bg-coral-500/80 transition-colors group-hover:bg-coral-600"
                style={{ height: `${Math.max((d.revenue / max) * 100, d.revenue > 0 ? 3 : 0.5)}%` }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-navy-900 px-2.5 py-1.5 text-xs text-white group-hover:block">
                {label(d.day)}: {formatPKR(d.revenue)} · {d.orders} orders
              </div>
            </div>
          ))}
        </div>
      )}
      {data.length > 0 && (
        <div className="mt-2 flex justify-between text-[11px] text-muted">
          <span>{label(data[0].day)}</span>
          <span>{label(data[data.length - 1].day)}</span>
        </div>
      )}
    </div>
  );
}
