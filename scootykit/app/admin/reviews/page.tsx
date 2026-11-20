import Link from "next/link";
import { Star } from "lucide-react";
import { Stars } from "@/components/home/sections";
import { ActionButton } from "@/components/admin/row-actions";
import { AdminHeader } from "@/components/admin/ui";
import { Badge, EmptyState } from "@/components/ui/misc";
import { moderateReview } from "@/lib/actions/admin/store";
import { getAdminReviews } from "@/lib/data/admin";
import { cn, firstParam, formatDate } from "@/lib/utils";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  const f = firstParam((await searchParams).filter);
  const filter = f === "approved" || f === "all" ? f : "pending";
  const reviews = await getAdminReviews(filter);
  return (
    <>
      <AdminHeader title="Reviews" description="Only customers with a delivered order can review a product. Reviews appear after you approve them." />
      <div className="mb-4 flex gap-2">
        {(["pending", "approved", "all"] as const).map((k) => (
          <Link key={k} href={`/admin/reviews?filter=${k}`} className={cn("rounded-full px-4 py-1.5 text-sm font-semibold capitalize", filter === k ? "bg-navy-900 text-white" : "border border-line bg-white")}>
            {k}
          </Link>
        ))}
      </div>
      {reviews.length === 0 ? (
        <EmptyState icon={Star} title={`No ${filter === "all" ? "" : filter} reviews`} />
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <Stars rating={r.rating} />
                <Badge tone={r.is_approved ? "success" : "warning"}>{r.is_approved ? "Approved" : "Pending"}</Badge>
                <span className="text-xs text-muted">
                  {r.author_name} · {formatDate(r.created_at)}
                </span>
              </div>
              {r.product && (
                <Link href={`/product/${r.product.slug}`} className="mt-2 block text-sm font-semibold text-coral-600 hover:underline">
                  {r.product.name}
                </Link>
              )}
              {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
              <p className="mt-1 text-sm text-navy-700">{r.body}</p>
              <div className="mt-4 flex gap-2">
                {r.is_approved ? (
                  <ActionButton action={moderateReview.bind(null, r.id, "unapprove")} label="Unpublish" />
                ) : (
                  <ActionButton action={moderateReview.bind(null, r.id, "approve")} label="Approve" variant="primary" />
                )}
                <ActionButton action={moderateReview.bind(null, r.id, "delete")} label="Delete" variant="ghost" confirmText="Delete this review?" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
