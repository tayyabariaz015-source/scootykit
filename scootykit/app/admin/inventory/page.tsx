import Link from "next/link";
import { Boxes } from "lucide-react";
import { AdminFilterBar } from "@/components/admin/admin-search";
import { StockEditor } from "@/components/admin/stock-editor";
import { AdminHeader, Table, Td, Th } from "@/components/admin/ui";
import { Badge, EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { getAdminProducts } from "@/lib/data/admin";
import { firstParam } from "@/lib/utils";

export const metadata = { title: "Inventory" };

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  const sp = await searchParams;
  const q = firstParam(sp.q) ?? "";
  const low = firstParam(sp.low) === "1";
  const page = Number(firstParam(sp.page)) || 1;
  const { rows, total, pageCount } = await getAdminProducts({ q, lowStock: low, page, pageSize: 50 });
  return (
    <>
      <AdminHeader title="Inventory" description={`${total} product${total === 1 ? "" : "s"}${low ? " with 5 or fewer in stock" : ""}`} />
      <AdminFilterBar action="/admin/inventory" q={q} placeholder="Search name or SKU…">
        <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm">
          <input type="checkbox" name="low" value="1" defaultChecked={low} className="h-4 w-4 accent-coral-500" /> Low stock only
        </label>
      </AdminFilterBar>
      {rows.length === 0 ? (
        <EmptyState icon={Boxes} title="Nothing to show" description={low ? "No products are low on stock." : "Add products to manage inventory."} />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th>Status</Th>
                <Th>Alert at</Th>
                <Th>Stock</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-coral-600">
                      {p.name}
                    </Link>
                    {p.stock === 0 ? (
                      <Badge tone="danger" className="ml-2">Out of stock</Badge>
                    ) : p.stock <= p.low_stock_threshold ? (
                      <Badge tone="warning" className="ml-2">Low</Badge>
                    ) : null}
                  </Td>
                  <Td className="text-muted">{p.sku ?? "—"}</Td>
                  <Td className="capitalize text-muted">{p.status}</Td>
                  <Td className="text-muted">≤ {p.low_stock_threshold}</Td>
                  <Td>
                    <StockEditor productId={p.id} stock={p.stock} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pageCount={pageCount} basePath="/admin/inventory" params={{ q: q || undefined, low: low ? "1" : undefined }} />
        </>
      )}
    </>
  );
}
