"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/session";
import { slugify } from "@/lib/commerce/slug";
import { createClient } from "@/lib/supabase/server";
import { productAdminSchema } from "@/lib/validation/schemas";
import { fieldErrors } from "@/lib/validation/helpers";
import type { ActionResult } from "@/types";
import { removeStorageObjects, uploadImageFile } from "./storage";

function refreshStorefront() {
  revalidatePath("/", "layout");
}

async function uniqueSlug(supabase: Awaited<ReturnType<typeof createClient>>, base: string, excludeId?: string) {
  const root = base || "product";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    let q = supabase.from("products").select("id").eq("slug", candidate);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

function readProductForm(formData: FormData) {
  const s = (k: string) => String(formData.get(k) ?? "");
  return {
    name: s("name"),
    slug: s("slug"),
    sku: s("sku"),
    category_id: s("category_id"),
    short_description: s("short_description"),
    description: s("description"),
    features: s("features"),
    price: s("price"),
    sale_price: s("sale_price"),
    stock: s("stock"),
    low_stock_threshold: s("low_stock_threshold") || "5",
    status: s("status") || "draft",
    is_featured: formData.get("is_featured") === "on",
    seo_title: s("seo_title"),
    seo_description: s("seo_description"),
    specifications: s("specifications") || "[]",
    cost_price: s("cost_price"),
    supplier_name: s("supplier_name"),
    supplier_url: s("supplier_url"),
  };
}

export async function saveProduct(productId: string | null, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (productId !== null && !z.uuid().safeParse(productId).success) return { ok: false, error: "Invalid product." };

  const parsed = productAdminSchema.safeParse(readProductForm(formData));
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const supabase = await createClient();

  if (v.status === "active") {
    // Publishing requires an image so the storefront never shows half-finished products.
    const imageCount = productId
      ? (await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId)).count ?? 0
      : 0;
    if (imageCount === 0) {
      return { ok: false, error: "Add at least one product image before publishing. Save as Draft first, then upload images.", fieldErrors: { status: ["Needs at least one image"] } };
    }
    if (!v.category_id) return { ok: false, error: "Choose a category before publishing.", fieldErrors: { category_id: ["Required to publish"] } };
  }

  const slug = await uniqueSlug(supabase, v.slug || slugify(v.name), productId ?? undefined);
  const row = {
    name: v.name,
    slug,
    sku: v.sku ? v.sku.toUpperCase() : null,
    category_id: v.category_id,
    short_description: v.short_description,
    description: v.description,
    features: v.features,
    price: v.price,
    sale_price: v.sale_price,
    stock: v.stock,
    low_stock_threshold: v.low_stock_threshold,
    status: v.status,
    is_featured: v.is_featured,
    seo_title: v.seo_title,
    seo_description: v.seo_description,
  };

  let id = productId;
  if (id) {
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) return dbError(error);
  } else {
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error) return dbError(error);
    id = data.id as string;
  }

  // Specifications: replace the full set
  await supabase.from("product_specifications").delete().eq("product_id", id);
  if (v.specifications.length) {
    const { error } = await supabase
      .from("product_specifications")
      .insert(v.specifications.map((s, i) => ({ product_id: id, label: s.label, value: s.value, sort_order: i })));
    if (error) return dbError(error);
  }

  // Private sourcing data
  const { error: srcErr } = await supabase
    .from("product_sourcing")
    .upsert({ product_id: id, cost_price: v.cost_price, supplier_name: v.supplier_name, supplier_url: v.supplier_url }, { onConflict: "product_id" });
  if (srcErr) return dbError(srcErr);

  refreshStorefront();
  revalidatePath("/admin/products");
  if (!productId) redirect(`/admin/products/${id}?created=1`);
  return { ok: true, message: "Product saved." };
}

function dbError(error: { code?: string; message: string }): ActionResult {
  if (error.code === "23505") {
    if (error.message.includes("sku")) return { ok: false, error: "That SKU is already used by another product.", fieldErrors: { sku: ["Already in use"] } };
    if (error.message.includes("slug")) return { ok: false, error: "That URL slug is already in use.", fieldErrors: { slug: ["Already in use"] } };
  }
  if (error.code === "23514") return { ok: false, error: "Some values aren't allowed (check prices, stock and status)." };
  console.error("[admin:product]", error);
  return { ok: false, error: "Couldn't save the product. Please try again." };
}

export async function setProductStatus(productId: string, status: "draft" | "active" | "archived"): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!z.uuid().safeParse(productId).success) return { ok: false, error: "Invalid product." };
  const supabase = await createClient();
  if (status === "active") {
    const { data: p } = await supabase.from("products").select("price, category_id, product_images(count)").eq("id", productId).single();
    const images = (p?.product_images as unknown as { count: number }[] | undefined)?.[0]?.count ?? 0;
    if (!p || Number(p.price) <= 0 || !p.category_id || images === 0) {
      return { ok: false, error: "To publish, the product needs a price, a category and at least one image." };
    }
  }
  const { error } = await supabase.from("products").update({ status }).eq("id", productId);
  if (error) return { ok: false, error: "Couldn't update status." };
  refreshStorefront();
  revalidatePath("/admin/products");
  return { ok: true, message: status === "archived" ? "Product archived." : status === "active" ? "Product published." : "Moved to drafts." };
}

/** Hard delete. Order history is preserved via order_items snapshots (product_id → null). */
export async function deleteProduct(productId: string, redirectTo?: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!z.uuid().safeParse(productId).success) return { ok: false, error: "Invalid product." };
  const supabase = await createClient();
  const { data: imgs } = await supabase.from("product_images").select("storage_path").eq("product_id", productId);
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) return { ok: false, error: "Couldn't delete the product." };
  await removeStorageObjects(supabase, (imgs ?? []).map((i) => i.storage_path).filter(Boolean) as string[]);
  refreshStorefront();
  revalidatePath("/admin/products");
  if (redirectTo === "/admin/products") redirect("/admin/products?deleted=1");
  return { ok: true, message: "Product deleted." };
}

export async function updateStock(productId: string, stock: number): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = z.object({ id: z.uuid(), stock: z.number().int().min(0).max(1_000_000) }).safeParse({ id: productId, stock });
  if (!parsed.success) return { ok: false, error: "Stock must be a whole number ≥ 0." };
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ stock: parsed.data.stock }).eq("id", parsed.data.id);
  if (error) return { ok: false, error: "Couldn't update stock." };
  refreshStorefront();
  revalidatePath("/admin/inventory");
  return { ok: true, message: "Stock updated." };
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------
export async function uploadProductImages(productId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!z.uuid().safeParse(productId).success) return { ok: false, error: "Invalid product." };
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, error: "Choose at least one image." };
  if (files.length > 8) return { ok: false, error: "Upload up to 8 images at a time." };

  const supabase = await createClient();
  const { count } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);
  if ((count ?? 0) + files.length > 12) return { ok: false, error: "A product can have up to 12 images." };
  const { data: product } = await supabase.from("products").select("name").eq("id", productId).single();

  let order = count ?? 0;
  const errors: string[] = [];
  for (const file of files) {
    const res = await uploadImageFile(supabase, file, `products/${productId}`);
    if ("error" in res) {
      errors.push(`${file.name}: ${res.error}`);
      continue;
    }
    const { error } = await supabase
      .from("product_images")
      .insert({ product_id: productId, url: res.url, storage_path: res.path, alt: product?.name ?? "", sort_order: order++ });
    if (error) {
      errors.push(`${file.name}: couldn't save`);
      await removeStorageObjects(supabase, [res.path]);
    }
  }
  refreshStorefront();
  revalidatePath(`/admin/products/${productId}`);
  if (errors.length) return { ok: false, error: errors.join(" · ") };
  return { ok: true, message: `${files.length} image${files.length > 1 ? "s" : ""} uploaded.` };
}

export async function deleteProductImage(imageId: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!z.uuid().safeParse(imageId).success) return { ok: false, error: "Invalid image." };
  const supabase = await createClient();
  const { data: img } = await supabase.from("product_images").select("product_id, storage_path").eq("id", imageId).single();
  if (!img) return { ok: false, error: "Image not found." };
  const { count } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", img.product_id);
  const { data: product } = await supabase.from("products").select("status").eq("id", img.product_id).single();
  if (product?.status === "active" && (count ?? 0) <= 1) return { ok: false, error: "A published product needs at least one image. Upload another first." };
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) return { ok: false, error: "Couldn't delete the image." };
  if (img.storage_path) await removeStorageObjects(supabase, [img.storage_path]);
  refreshStorefront();
  revalidatePath(`/admin/products/${img.product_id}`);
  return { ok: true };
}

export async function updateProductImages(productId: string, images: { id: string; alt: string }[]): Promise<ActionResult> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = z.array(z.object({ id: z.uuid(), alt: z.string().trim().max(200) })).max(12).safeParse(images);
  if (!parsed.success || !z.uuid().safeParse(productId).success) return { ok: false, error: "Invalid data." };
  const supabase = await createClient();
  for (const [i, img] of parsed.data.entries()) {
    await supabase.from("product_images").update({ sort_order: i, alt: img.alt }).eq("id", img.id).eq("product_id", productId);
  }
  refreshStorefront();
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true, message: "Images updated." };
}

