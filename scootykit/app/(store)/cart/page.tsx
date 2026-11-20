import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { Breadcrumbs, PageHeader } from "@/components/ui/misc";
import { getActiveDeliveryZones, getStoreSettings } from "@/lib/data/settings";

export const metadata: Metadata = { title: "Your Cart", robots: { index: false } };
export const revalidate = 120;

export default async function CartPage() {
  const [zones, settings] = await Promise.all([getActiveDeliveryZones(), getStoreSettings()]);
  const nationwide = zones.find((z) => !z.province && !z.city);
  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader title="Your cart">
        <Breadcrumbs items={[{ label: "Cart" }]} />
      </PageHeader>
      <CartView estimatedDelivery={nationwide ? nationwide.charge : null} freeThreshold={settings.free_delivery_threshold} />
    </div>
  );
}
