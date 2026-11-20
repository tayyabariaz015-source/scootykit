import { AdminHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { Alert } from "@/components/ui/misc";
import { getAdminCategories } from "@/lib/data/admin";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  const categories = await getAdminCategories();
  return (
    <>
      <AdminHeader title="Add product" back={{ href: "/admin/products", label: "Products" }} />
      <Alert tone="info" className="mb-6">
        New products start as <strong>Draft</strong>. Save, upload images on the next screen, then set the status to Active to publish.
      </Alert>
      <ProductForm product={null} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </>
  );
}
