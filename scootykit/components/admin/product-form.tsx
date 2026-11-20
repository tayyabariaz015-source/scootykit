"use client";
import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveProduct } from "@/lib/actions/admin/products";
import { slugify } from "@/lib/commerce/slug";
import { formatPKR } from "@/lib/commerce/format";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import type { AdminProductDetail } from "@/lib/data/admin";
import type { ActionResult } from "@/types";
import { FormMessage, Panel } from "./ui";

export function ProductForm({ product, categories }: { product: AdminProductDetail | null; categories: { id: string; name: string }[] }) {
  const action = saveProduct.bind(null, product?.id ?? null);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k]?.[0] : undefined);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>(product?.specifications.map((s) => ({ label: s.label, value: s.value })) ?? []);
  const [price, setPrice] = useState(product && product.price > 0 ? String(product.price) : "");
  const [cost, setCost] = useState(product?.sourcing?.cost_price != null ? String(product.sourcing.cost_price) : "");
  const [salePrice, setSalePrice] = useState(product?.sale_price != null ? String(product.sale_price) : "");

  const sell = Number(salePrice || price);
  const margin = sell > 0 && cost ? sell - Number(cost) : null;

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[1fr_340px]" noValidate>
      <div className="space-y-6">
        <FormMessage state={state} />
        <Panel title="Basic information">
          <div className="grid gap-4">
            <Field label="Product name" htmlFor="name" error={err("name")} required>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="URL slug" htmlFor="slug" error={err("slug")} hint={`/product/${slug || "…"}`}>
                <Input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value.toLowerCase());
                  }}
                />
              </Field>
              <Field label="SKU" htmlFor="sku" error={err("sku")}>
                <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} className="uppercase" />
              </Field>
            </div>
            <Field label="Short description" htmlFor="short_description" error={err("short_description")} hint="Shown near the price (max 300 characters)">
              <Textarea id="short_description" name="short_description" rows={2} maxLength={300} defaultValue={product?.short_description ?? ""} />
            </Field>
            <Field label="Full description" htmlFor="description" error={err("description")}>
              <Textarea id="description" name="description" rows={7} defaultValue={product?.description ?? ""} />
            </Field>
            <Field label="Key features" htmlFor="features" error={err("features")} hint="One feature per line (up to 20)">
              <Textarea id="features" name="features" rows={4} defaultValue={product?.features.join("\n") ?? ""} />
            </Field>
          </div>
        </Panel>

        <Panel title="Specifications">
          <input type="hidden" name="specifications" value={JSON.stringify(specs.filter((s) => s.label.trim() && s.value.trim()))} />
          {specs.length === 0 && <p className="mb-3 text-sm text-muted">No specifications yet (e.g. Material, Size, Weight).</p>}
          <div className="space-y-2">
            {specs.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1.5fr_auto] gap-2">
                <Input aria-label={`Specification ${i + 1} label`} placeholder="Label" value={s.label} onChange={(e) => setSpecs((xs) => xs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <Input aria-label={`Specification ${i + 1} value`} placeholder="Value" value={s.value} onChange={(e) => setSpecs((xs) => xs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                <Button variant="ghost" size="icon" onClick={() => setSpecs((xs) => xs.filter((_, j) => j !== i))} aria-label="Remove specification">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setSpecs((xs) => [...xs, { label: "", value: "" }])} disabled={specs.length >= 40}>
            <Plus className="h-4 w-4" /> Add specification
          </Button>
          {err("specifications") && <p className="mt-2 text-[13px] text-red-600">{err("specifications")}</p>}
        </Panel>

        <Panel title="SEO">
          <div className="grid gap-4">
            <Field label="SEO title" htmlFor="seo_title" error={err("seo_title")} hint="Defaults to the product name (max 70)">
              <Input id="seo_title" name="seo_title" maxLength={70} defaultValue={product?.seo_title ?? ""} />
            </Field>
            <Field label="SEO description" htmlFor="seo_description" error={err("seo_description")} hint="Max 170 characters">
              <Textarea id="seo_description" name="seo_description" rows={2} maxLength={170} defaultValue={product?.seo_description ?? ""} />
            </Field>
          </div>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Publishing">
          <div className="space-y-4">
            <Field label="Status" htmlFor="status" error={err("status")} hint="Published products need a price, category and image.">
              <Select id="status" name="status" defaultValue={product?.status ?? "draft"}>
                <option value="draft">Draft (hidden)</option>
                <option value="active">Active (visible in store)</option>
                <option value="archived">Archived (hidden)</option>
              </Select>
            </Field>
            <Field label="Category" htmlFor="category_id" error={err("category_id")}>
              <Select id="category_id" name="category_id" defaultValue={product?.category_id ?? ""}>
                <option value="">— Select category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Checkbox name="is_featured" defaultChecked={product?.is_featured ?? false} label="Feature on homepage" />
            <Button type="submit" size="lg" className="w-full" loading={pending}>
              {product ? "Save changes" : "Create product"}
            </Button>
          </div>
        </Panel>

        <Panel title="Pricing (PKR)">
          <div className="grid gap-4">
            <Field label="Selling price" htmlFor="price" error={err("price")} required>
              <Input id="price" name="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
            <Field label="Sale price (optional)" htmlFor="sale_price" error={err("sale_price")} hint="Only set a real, lower price you'll honour.">
              <Input id="sale_price" name="sale_price" inputMode="decimal" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
            </Field>
          </div>
        </Panel>

        <Panel title="Inventory">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Stock" htmlFor="stock" error={err("stock")}>
              <Input id="stock" name="stock" inputMode="numeric" defaultValue={product?.stock ?? 0} />
            </Field>
            <Field label="Low-stock alert" htmlFor="low_stock_threshold" error={err("low_stock_threshold")}>
              <Input id="low_stock_threshold" name="low_stock_threshold" inputMode="numeric" defaultValue={product?.low_stock_threshold ?? 5} />
            </Field>
          </div>
        </Panel>

        <Panel title="Sourcing (private)">
          <div className="grid gap-4">
            <Field label="Cost price" htmlFor="cost_price" error={err("cost_price")} hint={margin !== null ? `Margin per unit: ${formatPKR(margin)}` : "Never shown to customers"}>
              <Input id="cost_price" name="cost_price" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
            </Field>
            <Field label="Supplier" htmlFor="supplier_name" error={err("supplier_name")}>
              <Input id="supplier_name" name="supplier_name" defaultValue={product?.sourcing?.supplier_name ?? ""} placeholder="Alibaba, Daraz seller…" />
            </Field>
            <Field label="Supplier URL" htmlFor="supplier_url" error={err("supplier_url")}>
              <Input id="supplier_url" name="supplier_url" type="url" defaultValue={product?.sourcing?.supplier_url ?? ""} />
            </Field>
            {product?.sourcing?.supplier_image_urls?.length ? (
              <div className="text-xs text-muted">
                <p className="font-semibold text-navy-900">Supplier image references ({product.sourcing.supplier_image_urls.length})</p>
                <p className="mt-1">For reference only. Upload images you own or have permission to use.</p>
                <ul className="mt-1.5 space-y-1">
                  {product.sourcing.supplier_image_urls.slice(0, 5).map((u) => (
                    <li key={u} className="truncate">
                      <a href={u} target="_blank" rel="noopener noreferrer nofollow" className="text-coral-600 hover:underline">
                        {u}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>
    </form>
  );
}
