import { CategoryForm } from "@/components/admin/category-form";
import { AdminHeader } from "@/components/admin/ui";

export const metadata = { title: "Add category" };

export default function NewCategoryPage() {
  return (
    <>
      <AdminHeader title="Add category" back={{ href: "/admin/categories", label: "Categories" }} />
      <CategoryForm category={null} />
    </>
  );
}
