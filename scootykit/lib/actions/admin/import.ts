"use server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/session";
import { mapRecords, validateImportRows, type ParsedImportRow } from "@/lib/commerce/import";
import { slugify } from "@/lib/commerce/slug";
import { getAllSkus } from "@/lib/data/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

/** Server-side re-validation of the preview (never trust the browser), then insert as DRAFTS. */
export async function previewImport(records: Record<string, unknown>[]): Promise<ActionResult<{ rows: ParsedImportRow[]; unknownHeaders: string[] }>> {
  const auth = await assertAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!Array.isArray(records) || records.length === 0) return { ok: false, error: "The file has no rows." };
  if (records.length > 1000) return { ok: false, error: "Import up to 1,000 rows at a time." };

  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id,name,slug");
  const { rows, unknownHeaders } = mapRecords(records);
  const parsed = validateImportRows(rows, categories ?? [], new Set(await getAllSkus()));
  return { ok: true, data: { rows: parsed, unknownHeaders } };
}

export async function commitImport(records: Record<string, unknown>[]): Promise<ActionResult<{ created: number; skipped: number }>> {
  const preview = await previewImport(records);
  if (!preview.ok) return preview;
  const valid = preview.data!.rows.filter((r) => r.errors.length === 0);
  if (valid.length === 0) return { ok: false, error: "No valid rows to import. Fix the errors and try again." };

  const supabase = await createClient();
  const { data: existing } = await supabase.from("products").select("slug").limit(10000);
  const taken = new Set((existing ?? []).map((p) => p.slug as string));
  const now = new Date().toISOString();
  let created = 0;

  for (const r of valid) {
    let base = slugify(r.name) || "product";
    let slug = base;
    for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
    taken.add(slug);
    base = slug;

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name: r.name,
        slug,
        sku: r.sku,
        category_id: r.categoryId,
        description: r.description,
        price: r.sellingPrice ?? 0,
        stock: r.stock ?? 0,
        status: "draft", // Never auto-publish supplier research.
      })
      .select("id")
      .single();
    if (error || !product) {
      console.error("[import]", error);
      continue;
    }
    created++;
    if (r.specifications.length) {
      await supabase.from("product_specifications").insert(r.specifications.map((s, i) => ({ product_id: product.id, label: s.label, value: s.value, sort_order: i })));
    }
    await supabase.from("product_sourcing").insert({
      product_id: product.id,
      supplier_url: r.supplierUrl,
      cost_price: r.costPrice,
      supplier_image_urls: r.imageUrls, // private reference only — not shown on the store
      imported_at: now,
    });
  }

  revalidatePath("/admin/products");
  return { ok: true, data: { created, skipped: preview.data!.rows.length - created } };
}
