import Image from "next/image";
import Link from "next/link";
import { Package, Plus, Upload } from "lucide-react";
import { AdminFilterBar, filterSelectClass } from "@/components/admin/admin-search";
import { AdminHeader, Table, Td, Th } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { getAdminCategories, getAdminProducts } from "@/lib/data/admin";
import { formatPKR } from "@/lib/commerce/format";
import { firstParam } from "@/lib/utils";

const STATUS_TONE = { active: "success", draft: "neutral", archived: "warning" } as const;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const q = firstParam(sp.q) ?? "";
  const status = firstParam(sp.status) ?? "";
  const category = firstParam(sp.category) ?? "";
  const page = Number(firstParam(sp.page)) || 1;
  const [{ rows, total, pageCount }, categories] = await Promise.all([getAdminProducts({ q, status, category, page }), getAdminCategories()]);

  return (
    <>
      <AdminHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"}${status ? ` · ${status}` : " (excluding archived)"}`}
        actions={
          <>
            <ButtonLink href="/admin/products/import" variant="outline">
              <Upload className="h-4 w-4" /> Import
            </ButtonLink>
            <ButtonLink href="/admin/products/new">
              <Plus className="h-4 w-4" /> Add product
            </ButtonLink>
          </>
        }
      />
      <AdminFilterBar action="/admin/products" q={q} placeholder="Search name or SKU…">
        <select name="status" defaultValue={status} className={filterSelectClass} aria-label="Status">
          <option value="">Active + drafts</option>
          <option value="active">Active</option>
          <option value="draft">Drafts</option>
          <option value="archived">Archived</option>
        </select>
        <select name="category" defaultValue={category} className={filterSelectClass} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </AdminFilterBar>

      {rows.length === 0 ? (
        <EmptyState
          icon={Package}
          title={q || status || category ? "No products match" : "No products yet"}
          description={q || status || category ? "Try a different search or filter." : "Add your first product or import your researched list as drafts."}
          action={<ButtonLink href="/admin/products/new">Add product</ButtonLink>}
        />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Stock</Th>
                <Th>Status</Th>
                <Th className="text-right">Sold</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-surface/60">
                  <Td>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface">
                        {p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-1 font-semibold hover:text-coral-600">{p.name}</span>
                        <span className="text-xs text-muted">{p.sku ?? "No SKU"}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="text-muted">{p.category?.name ?? "—"}</Td>
                  <Td>
                    <span className="font-semibold">{p.price > 0 ? formatPKR(p.sale_price ?? p.price) : "—"}</span>
                    {p.sale_price !== null && <span className="block text-xs text-muted line-through">{formatPKR(p.price)}</span>}
                  </Td>
                  <Td>
                    <span className={p.stock === 0 ? "font-semibold text-red-600" : p.stock <= p.low_stock_threshold ? "font-semibold text-amber-700" : ""}>{p.stock}</span>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                      {p.is_featured && <Badge tone="coral">Featured</Badge>}
                    </div>
                  </Td>
                  <Td className="text-right text-muted">{p.units_sold}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pageCount={pageCount} basePath="/admin/products" params={{ q: q || undefined, status: status || undefined, category: category || undefined }} />
        </>
      )}
    </>
  );
}
