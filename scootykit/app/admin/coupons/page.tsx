import Link from "next/link";
import { Plus, Tag } from "lucide-react";
import { ActionButton } from "@/components/admin/row-actions";
import { AdminHeader, Table, Td, Th } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/misc";
import { deleteCoupon } from "@/lib/actions/admin/store";
import { getCoupons } from "@/lib/data/admin";
import { formatPKR } from "@/lib/commerce/format";
import { formatDate } from "@/lib/utils";
import type { Coupon } from "@/types";

export const metadata = { title: "Coupons" };

function couponState(c: Coupon, now: number): { label: string; tone: "success" | "neutral" | "warning" | "danger" } {
  if (!c.is_active) return { label: "Inactive", tone: "neutral" };
  if (c.expires_at && new Date(c.expires_at).getTime() < now) return { label: "Expired", tone: "danger" };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: "Scheduled", tone: "warning" };
  if (c.usage_limit !== null && c.times_used >= c.usage_limit) return { label: "Used up", tone: "danger" };
  return { label: "Live", tone: "success" };
}

function currentTime() {
  return Date.now();
}

export default async function CouponsPage() {
  const coupons = await getCoupons();
  const now = currentTime();
  return (
    <>
      <AdminHeader
        title="Coupons"
        description="Coupons are validated server-side at checkout."
        actions={
          <ButtonLink href="/admin/coupons/new">
            <Plus className="h-4 w-4" /> New coupon
          </ButtonLink>
        }
      />
      {coupons.length === 0 ? (
        <EmptyState icon={Tag} title="No coupons yet" description="Create a coupon only for offers you genuinely intend to honour." action={<ButtonLink href="/admin/coupons/new">New coupon</ButtonLink>} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Discount</Th>
              <Th>Conditions</Th>
              <Th>Used</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => {
              const s = couponState(c, now);
              return (
                <tr key={c.id}>
                  <Td>
                    <Link href={`/admin/coupons/${c.id}`} className="font-mono font-semibold hover:text-coral-600">
                      {c.code}
                    </Link>
                    {c.description && <p className="text-xs text-muted">{c.description}</p>}
                  </Td>
                  <Td>{c.discount_type === "percent" ? `${c.discount_value}%` : formatPKR(c.discount_value)}</Td>
                  <Td className="text-xs text-muted">
                    {c.min_order_amount > 0 && <p>Min {formatPKR(c.min_order_amount)}</p>}
                    {c.max_discount !== null && <p>Max {formatPKR(c.max_discount)}</p>}
                    {c.expires_at && <p>Until {formatDate(c.expires_at)}</p>}
                  </Td>
                  <Td>
                    {c.times_used}
                    {c.usage_limit !== null && ` / ${c.usage_limit}`}
                  </Td>
                  <Td>
                    <Badge tone={s.tone}>{s.label}</Badge>
                  </Td>
                  <Td className="text-right">
                    <ActionButton action={deleteCoupon.bind(null, c.id)} label="Delete" variant="ghost" confirmText={`Delete coupon ${c.code}?`} />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
