import Link from "next/link";
import { Plus } from "lucide-react";
import { ActionButton } from "@/components/admin/row-actions";
import { AdminHeader, Table, Td, Th } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Alert, Badge } from "@/components/ui/misc";
import { deleteCategory, toggleCategoryVisibility } from "@/lib/actions/admin/store";
import { getAdminCategories } from "@/lib/data/admin";
import { firstParam } from "@/lib/utils";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  const categories = await getAdminCategories();
  const created = firstParam((await searchParams).created) === "1";
  return (
    <>
      <AdminHeader
        title="Categories"
        description={`${categories.length} categories`}
        actions={
          <ButtonLink href="/admin/categories/new">
            <Plus className="h-4 w-4" /> Add category
          </ButtonLink>
        }
      />
      {created && <Alert tone="success" className="mb-4">Category created.</Alert>}
      <Table>
        <thead>
          <tr>
            <Th>Category</Th>
            <Th>Slug</Th>
            <Th>Products</Th>
            <Th>Visibility</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} className="hover:bg-surface/60">
              <Td>
                <Link href={`/admin/categories/${c.id}`} className="flex items-center gap-3 font-semibold hover:text-coral-600">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-navy-700">
                    <CategoryIcon name={c.icon} className="h-4.5 w-4.5" />
                  </span>
                  {c.name}
                </Link>
              </Td>
              <Td className="text-muted">/category/{c.slug}</Td>
              <Td>{c.total_products}</Td>
              <Td>{c.is_visible ? <Badge tone="success">Visible</Badge> : <Badge>Hidden</Badge>}</Td>
              <Td>
                <div className="flex justify-end gap-2">
                  <ActionButton action={toggleCategoryVisibility.bind(null, c.id, !c.is_visible)} label={c.is_visible ? "Hide" : "Show"} variant="ghost" />
                  {c.total_products === 0 && (
                    <ActionButton action={deleteCategory.bind(null, c.id)} label="Delete" variant="ghost" confirmText={`Delete “${c.name}”? Its URL will stop working.`} />
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
