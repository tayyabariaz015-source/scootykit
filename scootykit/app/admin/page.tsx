import Link from "next/link";
import { AlertTriangle, Banknote, Boxes, CheckCircle2, Clock, Package, ShoppingCart, Users } from "lucide-react";
import { SalesChart } from "@/components/admin/sales-chart";
import { AdminHeader, Panel, StatCard, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/misc";
import { getAdminProducts, getAdminStats, getDeliveryZones, getRecentOrders, getSalesSeries, getTopProducts } from "@/lib/data/admin";
import { getStoreSettings } from "@/lib/data/settings";
import { formatPKR } from "@/lib/commerce/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/commerce/status";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboard() {
  const [stats, series, recent, lowStock, top, settings, zones] = await Promise.all([
    getAdminStats(),
    getSalesSeries(30),
    getRecentOrders(6),
    getAdminProducts({ lowStock: true, status: "active", pageSize: 6 }),
    getTopProducts(5),
    getStoreSettings(),
    getDeliveryZones(),
  ]);

  const checklist = [
    { done: stats.active_products > 0, label: "Publish your first product", href: "/admin/products/new" },
    { done: Boolean(settings.contact_phone || settings.contact_email), label: "Add contact details", href: "/admin/settings" },
    { done: !zones.some((z) => !z.province && !z.city && z.name.includes("(default)")), label: "Confirm your delivery charges (default is a placeholder)", href: "/admin/delivery" },
    { done: settings.bank_transfer_enabled, label: "Optional: enable bank transfer with your account details", href: "/admin/settings", optional: true },
  ];
  const pendingSetup = checklist.filter((c) => !c.done && !("optional" in c));

  return (
    <>
      <AdminHeader title="Dashboard" description="Live numbers from your store database." />

      {pendingSetup.length > 0 && (
        <Panel title="Launch checklist" className="mb-6">
          <ul className="space-y-2">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2.5 text-sm">
                {c.done ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" /> : <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />}
                {c.done ? (
                  <span className="text-muted line-through">{c.label}</span>
                ) : (
                  <Link href={c.href} className="font-medium hover:text-coral-600 hover:underline">
                    {c.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total sales" value={formatPKR(stats.total_sales)} icon={Banknote} tone="emerald" hint="Paid or delivered orders" />
        <StatCard label="Total orders" value={stats.total_orders} icon={ShoppingCart} href="/admin/orders" />
        <StatCard label="Pending orders" value={stats.pending_orders} icon={Clock} tone="amber" href="/admin/orders?status=pending" />
        <StatCard label="Completed orders" value={stats.completed_orders} icon={CheckCircle2} tone="emerald" href="/admin/orders?status=delivered" />
        <StatCard label="Products" value={stats.total_products} icon={Package} href="/admin/products" hint={`${stats.active_products} published`} />
        <StatCard label="Customers" value={stats.total_customers} icon={Users} href="/admin/customers" hint="Registered accounts" />
        <StatCard label="Low stock" value={stats.low_stock} icon={Boxes} tone="coral" href="/admin/inventory?low=1" />
        <StatCard label="Awaiting payment" value={stats.awaiting_payment} icon={Banknote} tone="amber" href="/admin/orders?payment=awaiting_verification" hint="Bank transfers to verify" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Last 30 days">
          <SalesChart data={series} />
        </Panel>
        <Panel title="Top products" bodyClassName="p-0">
          {top.length === 0 ? (
            <p className="p-5 text-sm text-muted">No sales yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {top.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <Link href={`/admin/products/${p.id}`} className="line-clamp-1 font-medium hover:text-coral-600">
                    {p.name}
                  </Link>
                  <span className="shrink-0 text-muted">{p.units_sold} sold</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Recent orders" actions={<Link href="/admin/orders" className="text-sm font-semibold text-coral-600 hover:underline">View all</Link>} bodyClassName="p-0">
          {recent.length === 0 ? (
            <p className="p-5 text-sm text-muted">No orders yet.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="hover:bg-surface/60">
                    <Td>
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-coral-600">
                        {o.order_number}
                      </Link>
                      <p className="text-xs text-muted">{formatDate(o.created_at, true)}</p>
                    </Td>
                    <Td>{o.customer_name}</Td>
                    <Td>
                      <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                    </Td>
                    <Td className="text-right font-semibold">{formatPKR(o.total)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
        <Panel title="Low stock" actions={<Link href="/admin/inventory?low=1" className="text-sm font-semibold text-coral-600 hover:underline">Inventory</Link>} bodyClassName="p-0">
          {lowStock.rows.length === 0 ? (
            <p className="p-5 text-sm text-muted">All published products are well stocked.</p>
          ) : (
            <ul className="divide-y divide-line">
              {lowStock.rows.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <Link href={`/admin/products/${p.id}`} className="line-clamp-1 font-medium hover:text-coral-600">
                    {p.name}
                  </Link>
                  <Badge tone={p.stock === 0 ? "danger" : "warning"}>{p.stock === 0 ? "Out" : `${p.stock} left`}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
