import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { AdminFilterBar, filterSelectClass } from "@/components/admin/admin-search";
import { AdminHeader, Table, Td, Th } from "@/components/admin/ui";
import { Badge, EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { getAdminOrders } from "@/lib/data/admin";
import { formatPKR } from "@/lib/commerce/format";
import { formatPhone } from "@/lib/commerce/phone";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
} from "@/lib/commerce/status";
import { firstParam, formatDate } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/types";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const q = firstParam(sp.q) ?? "";
  const statusRaw = firstParam(sp.status) ?? "";
  const paymentRaw = firstParam(sp.payment) ?? "";
  const status = ORDER_STATUSES.includes(statusRaw as OrderStatus) ? statusRaw : "";
  const payment = PAYMENT_STATUSES.includes(paymentRaw as PaymentStatus) ? paymentRaw : "";
  const page = Number(firstParam(sp.page)) || 1;
  const { rows, total, pageCount } = await getAdminOrders({ q, status, payment, page });

  return (
    <>
      <AdminHeader title="Orders" description={`${total} order${total === 1 ? "" : "s"}`} />
      <AdminFilterBar action="/admin/orders" q={q} placeholder="Order number, name, phone or city…">
        <select name="status" defaultValue={status} className={filterSelectClass} aria-label="Order status">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select name="payment" defaultValue={payment} className={filterSelectClass} aria-label="Payment status">
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </AdminFilterBar>
      {rows.length === 0 ? (
        <EmptyState icon={ShoppingCart} title={q || status || payment ? "No orders match" : "No orders yet"} description={q || status || payment ? "Try a different search or filter." : "Orders placed on the store will appear here."} />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-surface/60">
                  <Td>
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-coral-600">
                      {o.order_number}
                    </Link>
                    <p className="text-xs text-muted">{formatDate(o.created_at, true)}</p>
                  </Td>
                  <Td>
                    <p className="font-medium">{o.customer_name}</p>
                    <p className="text-xs text-muted">
                      {formatPhone(o.phone)} · {o.city}
                    </p>
                  </Td>
                  <Td>
                    <p className="text-xs text-muted">{PAYMENT_METHOD_LABEL[o.payment_method]}</p>
                    <Badge tone={PAYMENT_STATUS_TONE[o.payment_status]}>{PAYMENT_STATUS_LABEL[o.payment_status]}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                  </Td>
                  <Td className="text-right font-semibold">{formatPKR(o.total)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pageCount={pageCount} basePath="/admin/orders" params={{ q: q || undefined, status: status || undefined, payment: payment || undefined }} />
        </>
      )}
    </>
  );
}
