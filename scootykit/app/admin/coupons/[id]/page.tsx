import { notFound } from "next/navigation";
import { CouponForm } from "@/components/admin/coupon-form";
import { AdminHeader } from "@/components/admin/ui";
import { getCoupon } from "@/lib/data/admin";

export const metadata = { title: "Edit coupon" };

export default async function EditCouponPage({ params }: PageProps<"/admin/coupons/[id]">) {
  const { id } = await params;
  const coupon = /^[0-9a-f-]{36}$/i.test(id) ? await getCoupon(id) : null;
  if (!coupon) notFound();
  return (
    <>
      <AdminHeader title={coupon.code} description={`Used ${coupon.times_used} time(s)`} back={{ href: "/admin/coupons", label: "Coupons" }} />
      <CouponForm coupon={coupon} />
    </>
  );
}
