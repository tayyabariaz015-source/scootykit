import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ImageManager } from "@/components/admin/image-manager";
import { ProductForm } from "@/components/admin/product-form";
import { ActionButton } from "@/components/admin/row-actions";
import { AdminHeader } from "@/components/admin/ui";
import { Alert, Badge } from "@/components/ui/misc";
import { deleteProduct, setProductStatus } from "@/lib/actions/admin/products";
import { getAdminCategories, getAdminProduct } from "@/lib/data/admin";
import { firstParam } from "@/lib/utils";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [product, categories] = await Promise.all([getAdminProduct(id), getAdminCategories()]);
  if (!product) notFound();
  const created = firstParam((await searchParams).created) === "1";

  return (
    <>
      <AdminHeader
        title={product.name}
        back={{ href: "/admin/products", label: "Products" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={product.status === "active" ? "success" : product.status === "archived" ? "warning" : "neutral"}>{product.status}</Badge>
            <span>{product.units_sold} sold</span>
          </span>
        }
        actions={
          <>
            {product.status === "active" && (
              <Link href={`/product/${product.slug}`} target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 text-sm font-semibold hover:bg-surface">
                View in store <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
            {product.status !== "archived" ? (
              <ActionButton action={setProductStatus.bind(null, product.id, "archived")} label="Archive" confirmText="Archive this product? It will be hidden from the store." />
            ) : (
              <ActionButton action={setProductStatus.bind(null, product.id, "draft")} label="Restore to drafts" />
            )}
            <ActionButton
              action={deleteProduct.bind(null, product.id, "/admin/products")}
              label="Delete"
              variant="danger"
              confirmText="Permanently delete this product and its images? Past orders keep their item snapshots. This cannot be undone."
            />
          </>
        }
      />
      {created && (
        <Alert tone="success" className="mb-6">
          Product created as a draft. Upload images below, then set the status to Active to publish.
        </Alert>
      )}
      <div className="mb-6">
        <ImageManager productId={product.id} images={product.images} />
      </div>
      <ProductForm product={product} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </>
  );
}
