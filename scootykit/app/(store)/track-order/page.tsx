import type { Metadata } from "next";
import { TrackOrderForm } from "@/components/checkout/track-order-form";
import { Breadcrumbs, PageHeader } from "@/components/ui/misc";
import { firstParam } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Check the status of your ScootyKit order with your order number and phone number.",
  alternates: { canonical: "/track-order" },
};

export default async function TrackOrderPage({ searchParams }: PageProps<"/track-order">) {
  const order = firstParam((await searchParams).order)?.slice(0, 20);
  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <PageHeader title="Track your order" description="Enter the order number from your confirmation and the mobile number you used at checkout.">
        <Breadcrumbs items={[{ label: "Track Order" }]} />
      </PageHeader>
      <TrackOrderForm initialOrderNumber={order} />
    </div>
  );
}
