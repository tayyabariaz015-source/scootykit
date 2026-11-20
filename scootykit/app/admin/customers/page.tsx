import { Users } from "lucide-react";
import { AdminFilterBar } from "@/components/admin/admin-search";
import { AdminHeader, Table, Td, Th } from "@/components/admin/ui";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { getAdminCustomers } from "@/lib/data/admin";
import { formatPKR } from "@/lib/commerce/format";
import { formatPhone } from "@/lib/commerce/phone";
import { firstParam, formatDate } from "@/lib/utils";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const sp = await searchParams;
  const q = firstParam(sp.q) ?? "";
  const page = Number(firstParam(sp.page)) || 1;
  const { rows, total, pageCount } = await getAdminCustomers({ q, page });
  return (
    <>
      <AdminHeader title="Customers" description={`${total} registered account${total === 1 ? "" : "s"}. Guest buyers appear in Orders.`} />
      <AdminFilterBar action="/admin/customers" q={q} placeholder="Name, email or phone…" />
      {rows.length === 0 ? (
        <EmptyState icon={Users} title={q ? "No customers match" : "No registered customers yet"} />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Phone</Th>
                <Th>Joined</Th>
                <Th>Orders</Th>
                <Th className="text-right">Spent</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <Td>
                    <p className="font-semibold">{c.full_name || "—"}</p>
                    <p className="text-xs text-muted">{c.email}</p>
                  </Td>
                  <Td className="text-muted">{c.phone ? formatPhone(c.phone) : "—"}</Td>
                  <Td className="text-muted">{formatDate(c.created_at)}</Td>
                  <Td>
                    {c.orders}
                    {c.last && <span className="block text-xs text-muted">Last: {formatDate(c.last)}</span>}
                  </Td>
                  <Td className="text-right font-semibold">{formatPKR(c.spent)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pageCount={pageCount} basePath="/admin/customers" params={{ q: q || undefined }} />
        </>
      )}
    </>
  );
}
