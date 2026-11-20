import { SettingsForm } from "@/components/admin/settings-form";
import { AdminHeader } from "@/components/admin/ui";
import { getStoreSettings } from "@/lib/data/settings";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getStoreSettings();
  return (
    <>
      <AdminHeader title="Store settings" description="Contact info, payments, delivery and announcements." />
      <SettingsForm settings={settings} />
    </>
  );
}
