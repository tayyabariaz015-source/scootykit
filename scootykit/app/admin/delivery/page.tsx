import Link from "next/link";
import { ActionButton } from "@/components/admin/row-actions";
import { DeliveryZoneForm } from "@/components/admin/delivery-zone-form";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { Alert } from "@/components/ui/misc";
import { deleteDeliveryZone } from "@/lib/actions/admin/store";
import { getDeliveryZones } from "@/lib/data/admin";
import { getStoreSettings } from "@/lib/data/settings";
import { formatPKR } from "@/lib/commerce/format";

export const metadata = { title: "Delivery charges" };

export default async function DeliveryPage() {
  const [zones, settings] = await Promise.all([getDeliveryZones(), getStoreSettings()]);
  const hasDefault = zones.some((z) => !z.province && !z.city && z.is_active);
  const placeholder = zones.find((z) => !z.province && !z.city && z.name.includes("(default)"));
  return (
    <>
      <AdminHeader title="Delivery charges" description="Charges are calculated on the server at checkout: city match → province match → nationwide default." />
      {placeholder && (
        <Alert tone="warning" title="Confirm your nationwide rate" className="mb-6">
          The nationwide default ({formatPKR(placeholder.charge)}) is a placeholder from setup. Update it to your real courier rate and rename the zone (e.g. “All Pakistan”) to clear this
          notice.
        </Alert>
      )}
      {!hasDefault && (
        <Alert tone="danger" title="No nationwide default" className="mb-6">
          Customers outside your listed cities/provinces can&apos;t check out until you add an active zone with no province and no city.
        </Alert>
      )}
      <Panel title="Zones" className="mb-6">
        <div className="space-y-4">
          {zones.map((z) => (
            <div key={z.id} className="rounded-xl border border-line p-3">
              <DeliveryZoneForm zone={z} />
              <div className="mt-2 flex justify-end">
                <ActionButton action={deleteDeliveryZone.bind(null, z.id)} label="Delete zone" variant="ghost" confirmText={`Delete zone “${z.name}”?`} />
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-dashed border-coral-200 bg-coral-50/40 p-3">
            <p className="mb-2 text-sm font-semibold">Add a zone</p>
            <DeliveryZoneForm zone={null} />
          </div>
        </div>
      </Panel>
      <Panel title="Free delivery">
        <p className="text-sm text-muted">
          {settings.free_delivery_threshold !== null
            ? `Orders of ${formatPKR(settings.free_delivery_threshold)} or more get free delivery.`
            : "No free-delivery offer is configured, so the store never promises free delivery."}{" "}
          Change this in{" "}
          <Link href="/admin/settings#delivery" className="font-semibold text-coral-600 hover:underline">
            Settings
          </Link>
          .
        </p>
      </Panel>
    </>
  );
}
