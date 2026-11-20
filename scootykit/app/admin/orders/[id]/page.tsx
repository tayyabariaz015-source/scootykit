import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/misc";
import { getAdminOrder } from "@/lib/data/admin";
import { formatPKR } from "@/lib/commerce/format";
import { formatPhone } from "@/lib/commerce/phone";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE } from "@/lib/commerce/status";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const order = await getAdminOrder(id);
  if (!order) notFound();
  const waNumber = `92${order.phone.slice(1)}`;

  return (
    <>
      <AdminHeader
        title={order.order_number}
        back={{ href: "/admin/orders", label: "Orders" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {formatDate(order.created_at, true)}
            <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
            <Badge tone={PAYMENT_STATUS_TONE[order.payment_status]}>{PAYMENT_STATUS_LABEL[order.payment_status]}</Badge>
          </span>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Panel title="Items" bodyClassName="p-0">
            <ul className="divide-y divide-line">
              {order.items?.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                  <div>
                    {i.product_id ? (
                      <Link href={`/admin/products/${i.product_id}`} className="font-medium hover:text-coral-600">
                        {i.product_name}
                      </Link>
                    ) : (
                      <span className="font-medium">{i.product_name} <span className="text-xs text-muted">(deleted product)</span></span>
                    )}
                    <p className="text-xs text-muted">
                      {i.sku ?? "No SKU"} · {i.quantity} × {formatPKR(i.unit_price)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatPKR(i.line_total)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPKR(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{formatPKR(order.delivery_charge)}</dd></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700"><dt>Discount {order.coupon_code && `(${order.coupon_code})`}</dt><dd>−{formatPKR(order.discount)}</dd></div>
              )}
              <div className="flex justify-between pt-1 text-base font-bold"><dt>Total</dt><dd>{formatPKR(order.total)}</dd></div>
            </dl>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Customer & delivery">
              <p className="font-semibold">{order.customer_name}</p>
              <p className="text-sm text-muted">{formatPhone(order.phone)}</p>
              {order.email && <p className="text-sm text-muted">{order.email}</p>}
              <p className="mt-3 text-sm leading-6">
                {order.address}
                <br />
                {order.city}, {order.province}
              </p>
              {order.notes && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Customer note: {order.notes}</p>}
              <div className="mt-4 flex gap-2">
                <a href={`tel:${order.phone}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold hover:bg-surface">
                  <Phone className="h-4 w-4" /> Call
                </a>
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold hover:bg-surface">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>
              <p className="mt-3 text-xs text-muted">{order.user_id ? "Registered customer" : "Guest checkout"}</p>
            </Panel>
            <Panel title="Payment">
              <p className="font-semibold">{PAYMENT_METHOD_LABEL[order.payment_method]}</p>
              <p className="text-sm text-muted">{PAYMENT_STATUS_LABEL[order.payment_status]}</p>
              {order.payment_reference && <p className="mt-2 text-sm">Reference: {order.payment_reference}</p>}
            </Panel>
          </div>

          <Panel title="History">
            <ol className="space-y-3">
              {order.history?.map((h, i) => (
                <li key={h.id ?? i} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral-500" />
                  <div>
                    <p className="font-medium">
                      {ORDER_STATUS_LABEL[h.status]} · {h.payment_status ? PAYMENT_STATUS_LABEL[h.payment_status] : ""}
                    </p>
                    <p className="text-xs text-muted">{formatDate(h.created_at, true)}</p>
                    {h.note && <p className="mt-0.5 text-muted">{h.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
        <div>
          <Panel title="Update order" className="xl:sticky xl:top-6">
            <OrderStatusForm order={order} />
          </Panel>
        </div>
      </div>
    </>
  );
}
