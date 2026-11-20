import { ImportWizard } from "@/components/admin/import-wizard";
import { AdminHeader } from "@/components/admin/ui";

export const metadata = { title: "Import products" };

export default function ImportPage() {
  return (
    <>
      <AdminHeader title="Import products" description="Bring in your Alibaba / Daraz research from CSV or Excel as draft products." back={{ href: "/admin/products", label: "Products" }} />
      <ImportWizard />
    </>
  );
}
