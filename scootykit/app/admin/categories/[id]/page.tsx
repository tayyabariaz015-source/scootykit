import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/category-form";
import { AdminHeader } from "@/components/admin/ui";
import { getAdminCategory } from "@/lib/data/admin";

export const metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const category = await getAdminCategory(id);
  if (!category) notFound();
  return (
    <>
      <AdminHeader title={category.name} back={{ href: "/admin/categories", label: "Categories" }} />
      <CategoryForm category={category} />
    </>
  );
}
