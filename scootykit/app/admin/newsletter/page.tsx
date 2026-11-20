import { Download, Mail } from "lucide-react";
import { ActionButton } from "@/components/admin/row-actions";
import { AdminHeader, Table, Td, Th } from "@/components/admin/ui";
import { Badge, EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { removeSubscriber } from "@/lib/actions/admin/store";
import { getSubscribers } from "@/lib/data/admin";
import { firstParam, formatDate } from "@/lib/utils";

export const metadata = { title: "Newsletter" };

export default async function NewsletterPage({ searchParams }: PageProps<"/admin/newsletter">) {
  const page = Number(firstParam((await searchParams).page)) || 1;
  const { rows, total, pageCount } = await getSubscribers(page);
  return (
    <>
      <AdminHeader
        title="Newsletter subscribers"
        description={`${total} subscriber${total === 1 ? "" : "s"}`}
        actions={
          total > 0 ? (
            <a href="/admin/newsletter/export" className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold hover:bg-surface">
              <Download className="h-4 w-4" /> Export CSV
            </a>
          ) : undefined
        }
      />
      {rows.length === 0 ? (
        <EmptyState icon={Mail} title="No subscribers yet" description="People who sign up from the homepage will appear here." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Email</Th>
                <Th>Status</Th>
                <Th>Joined</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <Td className="font-medium">{s.email}</Td>
                  <Td>
                    <Badge tone={s.status === "subscribed" ? "success" : "neutral"}>{s.status}</Badge>
                  </Td>
                  <Td className="text-muted">{formatDate(s.created_at)}</Td>
                  <Td className="text-right">
                    <ActionButton action={removeSubscriber.bind(null, s.id)} label="Remove" variant="ghost" confirmText={`Remove ${s.email}?`} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pageCount={pageCount} basePath="/admin/newsletter" params={{}} />
        </>
      )}
    </>
  );
}
