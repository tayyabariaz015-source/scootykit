import { CouponForm } from "@/components/admin/coupon-form";
import { AdminHeader } from "@/components/admin/ui";

export const metadata = { title: "New coupon" };

export default function NewCouponPage() {
  return (
    <>
      <AdminHeader title="New coupon" back={{ href: "/admin/coupons", label: "Coupons" }} />
      <CouponForm coupon={null} />
    </>
  );
}
