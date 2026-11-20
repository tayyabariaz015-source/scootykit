import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/misc";
import { formatPKR } from "@/lib/commerce/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/commerce/status";
import { formatDate } from "@/lib/utils";
import type { Order } from "@/types";

export function OrderList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <EmptyState icon={Package} title="No orders yet" description="When you place an order while signed in, it will show up here." action={<ButtonLink href="/shop">Start shopping</ButtonLink>} />;
  }
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/order-confirmation/${o.order_number}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-surface sm:p-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{o.order_number}</p>
                <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">
                {formatDate(o.created_at)} · {o.items?.reduce((n, i) => n + i.quantity, 0) ?? 0} items
              </p>
              <p className="mt-0.5 line-clamp-1 text-sm text-muted">{o.items?.map((i) => i.product_name).join(", ")}</p>
            </div>
            <p className="font-display font-extrabold">{formatPKR(o.total)}</p>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
