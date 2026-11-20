import { MessageSquare } from "lucide-react";
import { ActionButton } from "@/components/admin/row-actions";
import { AdminHeader } from "@/components/admin/ui";
import { Badge, EmptyState } from "@/components/ui/misc";
import { markMessage } from "@/lib/actions/admin/store";
import { getMessages } from "@/lib/data/admin";
import { formatPhone } from "@/lib/commerce/phone";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const messages = await getMessages();
  return (
    <>
      <AdminHeader title="Contact messages" description={`${messages.filter((m) => !m.is_read).length} unread`} />
      {messages.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No messages yet" description="Messages from the Contact page appear here." />
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className={`rounded-2xl border bg-white p-5 ${m.is_read ? "border-line" : "border-coral-200"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{m.name}</p>
                {!m.is_read && <Badge tone="coral">New</Badge>}
                <span className="text-xs text-muted">{formatDate(m.created_at, true)}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {m.email && (
                  <a href={`mailto:${m.email}`} className="hover:underline">
                    {m.email}
                  </a>
                )}
                {m.email && m.phone && " · "}
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="hover:underline">
                    {formatPhone(m.phone)}
                  </a>
                )}
              </p>
              {m.subject && <p className="mt-3 font-semibold">{m.subject}</p>}
              <p className="mt-1 whitespace-pre-line text-sm text-navy-700">{m.message}</p>
              <div className="mt-4">
                <ActionButton action={markMessage.bind(null, m.id, !m.is_read)} label={m.is_read ? "Mark unread" : "Mark as read"} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
