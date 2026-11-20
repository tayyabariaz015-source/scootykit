/**
 * CSV / Excel product import — pure parsing & validation (no I/O), shared by the
 * browser preview and the server action that writes drafts.
 *
 * Imported rows ALWAYS become draft products. Supplier image URLs are stored as
 * private references only and are never copied into the store.
 */

export const IMPORT_COLUMNS = [
  "name",
  "category",
  "sku",
  "supplier_url",
  "images",
  "description",
  "specifications",
  "cost_price",
  "selling_price",
  "stock",
] as const;

type ImportColumn = (typeof IMPORT_COLUMNS)[number];

const HEADER_ALIASES: Record<string, ImportColumn> = {
  name: "name",
  "product name": "name",
  title: "name",
  "product title": "name",
  category: "category",
  "category name": "category",
  sku: "sku",
  "product sku": "sku",
  "supplier url": "supplier_url",
  supplier_url: "supplier_url",
  "source url": "supplier_url",
  url: "supplier_url",
  link: "supplier_url",
  "product url": "supplier_url",
  images: "images",
  image: "images",
  "image urls": "images",
  "product images": "images",
  description: "description",
  "product description": "description",
  specifications: "specifications",
  specs: "specifications",
  "cost price": "cost_price",
  cost_price: "cost_price",
  cost: "cost_price",
  "selling price": "selling_price",
  selling_price: "selling_price",
  price: "selling_price",
  "sale price": "selling_price",
  stock: "stock",
  quantity: "stock",
  qty: "stock",
  inventory: "stock",
};

export function normalizeHeader(header: string): ImportColumn | null {
  const key = header.trim().toLowerCase().replace(/\s+/g, " ").replace(/[()]/g, "").replace(/ pkr$/, "");
  return HEADER_ALIASES[key] ?? HEADER_ALIASES[key.replace(/ /g, "_")] ?? null;
}

export interface ImportCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface ParsedImportRow {
  rowNumber: number;
  name: string;
  categoryInput: string;
  categoryId: string | null;
  sku: string | null;
  supplierUrl: string | null;
  imageUrls: string[];
  description: string;
  specifications: { label: string; value: string }[];
  costPrice: number | null;
  sellingPrice: number | null;
  stock: number | null;
  errors: string[];
  warnings: string[];
}

function parseMoney(raw: string): number | null | "invalid" {
  const v = raw.trim().replace(/^rs\.?\s*/i, "").replace(/^pkr\s*/i, "").replace(/,/g, "");
  if (v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return "invalid";
  return Math.round(n * 100) / 100;
}

function parseSpecs(raw: string): { label: string; value: string }[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[;\n|]/)
    .map((part) => {
      const idx = part.search(/[:=]/);
      if (idx <= 0) return null;
      const label = part.slice(0, idx).trim().slice(0, 80);
      const value = part.slice(idx + 1).trim().slice(0, 300);
      return label && value ? { label, value } : null;
    })
    .filter((s): s is { label: string; value: string } => s !== null)
    .slice(0, 40);
}

function parseUrls(raw: string): string[] {
  return raw
    .split(/[\s,|;]+/)
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, 12);
}

/** Maps raw spreadsheet records (header → cell) into canonical column records. */
export function mapRecords(records: Record<string, unknown>[]): { rows: Record<ImportColumn, string>[]; unknownHeaders: string[] } {
  const unknown = new Set<string>();
  const rows = records.map((rec) => {
    const out = Object.fromEntries(IMPORT_COLUMNS.map((c) => [c, ""])) as Record<ImportColumn, string>;
    for (const [header, value] of Object.entries(rec)) {
      const col = normalizeHeader(header);
      if (!col) {
        if (header.trim()) unknown.add(header.trim());
        continue;
      }
      out[col] = value === null || value === undefined ? "" : String(value).trim();
    }
    return out;
  });
  return { rows, unknownHeaders: [...unknown] };
}

export function validateImportRows(
  rows: Record<ImportColumn, string>[],
  categories: ImportCategoryRef[],
  existingSkus: Set<string> = new Set(),
): ParsedImportRow[] {
  const byKey = new Map<string, ImportCategoryRef>();
  for (const c of categories) {
    byKey.set(c.slug.toLowerCase(), c);
    byKey.set(c.name.toLowerCase(), c);
  }
  const existing = new Set([...existingSkus].map((s) => s.toUpperCase()));
  const seenInFile = new Map<string, number>();

  return rows.map((r, i) => {
    const rowNumber = i + 2; // header is row 1
    const errors: string[] = [];
    const warnings: string[] = [];

    const name = r.name.slice(0, 160);
    if (name.length < 2) errors.push("Product name is required");

    const category = byKey.get(r.category.toLowerCase()) ?? null;
    if (!r.category) warnings.push("No category — assign one before publishing");
    else if (!category) warnings.push(`Unknown category "${r.category}" — will be left unassigned`);

    const sku = r.sku ? r.sku.toUpperCase().slice(0, 64) : null;
    if (sku) {
      if (existing.has(sku)) errors.push(`SKU ${sku} already exists in the store`);
      const firstRow = seenInFile.get(sku);
      if (firstRow !== undefined) errors.push(`Duplicate SKU ${sku} (also on row ${firstRow})`);
      else seenInFile.set(sku, rowNumber);
    } else {
      warnings.push("No SKU");
    }

    const supplierUrl = r.supplier_url && /^https?:\/\//i.test(r.supplier_url) ? r.supplier_url.slice(0, 1000) : null;
    if (r.supplier_url && !supplierUrl) warnings.push("Supplier URL ignored (must start with http/https)");

    const cost = parseMoney(r.cost_price);
    const sell = parseMoney(r.selling_price);
    if (cost === "invalid") errors.push("Cost price is not a valid number");
    if (sell === "invalid") errors.push("Selling price is not a valid number");
    if (sell === null) warnings.push("No selling price — set a verified price before publishing");

    let stock: number | null = null;
    if (r.stock.trim() !== "") {
      const n = Number(r.stock.replace(/,/g, ""));
      if (!Number.isInteger(n) || n < 0) errors.push("Stock must be a whole number ≥ 0");
      else stock = n;
    } else {
      warnings.push("No stock — will import as 0");
    }

    const imageUrls = parseUrls(r.images);
    if (imageUrls.length > 0) {
      warnings.push("Supplier images saved as private references only — upload images you have rights to use");
    }

    return {
      rowNumber,
      name,
      categoryInput: r.category,
      categoryId: category?.id ?? null,
      sku,
      supplierUrl,
      imageUrls,
      description: r.description.slice(0, 10000),
      specifications: parseSpecs(r.specifications),
      costPrice: cost === "invalid" ? null : cost,
      sellingPrice: sell === "invalid" ? null : sell,
      stock,
      errors,
      warnings,
    };
  });
}
