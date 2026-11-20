import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { escapeLike, toNullableNumber, toNumber } from "@/lib/utils";
import type { Category, Product, ProductImage, ProductSpec, ProductSummary, RatingStats, Review } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const PRODUCT_SUMMARY_SELECT =
  "id,name,slug,price,sale_price,stock,is_featured,short_description,category:categories(id,name,slug),images:product_images(id,url,alt,sort_order)";

const PRODUCT_DETAIL_SELECT =
  "id,name,slug,sku,price,sale_price,stock,is_featured,status,short_description,description,features,low_stock_threshold,seo_title,seo_description,created_at,updated_at," +
  "category:categories(id,name,slug),images:product_images(id,url,alt,sort_order),specifications:product_specifications(id,label,value,sort_order)";

function sortImages(images: any[] | null | undefined): ProductImage[] {
  return [...(images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => ({ id: i.id, url: i.url, alt: i.alt ?? "", sort_order: i.sort_order }));
}

export function mapProductSummary(row: any): ProductSummary {
  const images = sortImages(row.images);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: toNumber(row.price),
    sale_price: toNullableNumber(row.sale_price),
    stock: row.stock ?? 0,
    is_featured: Boolean(row.is_featured),
    short_description: row.short_description ?? "",
    image: images[0] ?? null,
    category: row.category ?? null,
  };
}

function mapProduct(row: any): Product {
  const summary = mapProductSummary(row);
  const specs: ProductSpec[] = [...(row.specifications ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({ id: s.id, label: s.label, value: s.value, sort_order: s.sort_order }));
  return {
    ...summary,
    sku: row.sku,
    description: row.description ?? "",
    features: row.features ?? [],
    status: row.status,
    low_stock_threshold: row.low_stock_threshold ?? 5,
    images: sortImages(row.images),
    specifications: specs,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    image_url: row.image_url,
    icon: row.icon ?? "package",
    sort_order: row.sort_order ?? 0,
    is_visible: row.is_visible ?? true,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    product_count: Array.isArray(row.products) ? toNumber(row.products[0]?.count) : undefined,
  };
}

function logError(scope: string, error: unknown) {
  console.error(`[catalog:${scope}]`, error);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await createPublicClient()
    .from("categories")
    // RLS limits the embedded count to active products for anonymous reads.
    .select("*, products(count)")
    .order("sort_order")
    .order("name");
  if (error) {
    logError("categories", error);
    return [];
  }
  return (data ?? []).map(mapCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await createPublicClient()
    .from("categories")
    // RLS limits the embedded count to active products for anonymous reads.
    .select("*, products(count)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) logError("category", error);
  return data ? mapCategory(data) : null;
}

// ---------------------------------------------------------------------------
// Product listing with filters
// ---------------------------------------------------------------------------
export type SortOption = "newest" | "price_asc" | "price_desc" | "popular";
export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popularity" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export interface ProductFilters {
  q?: string;
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  availability?: "in_stock" | "out_of_stock";
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface ProductPage {
  products: ProductSummary[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductPage> {
  const pageSize = Math.min(Math.max(filters.pageSize ?? 24, 1), 60);
  const page = Math.max(filters.page ?? 1, 1);
  const empty: ProductPage = { products: [], total: 0, page, pageCount: 0, pageSize };
  if (!isSupabaseConfigured()) return empty;

  let query = createPublicClient()
    .from("products")
    .select(PRODUCT_SUMMARY_SELECT, { count: "exact" })
    .eq("status", "active");

  const q = filters.q?.trim().slice(0, 80);
  if (q) query = query.ilike("name", `%${escapeLike(q)}%`);
  if (filters.categoryIds?.length) query = query.in("category_id", filters.categoryIds);
  if (filters.minPrice !== undefined && Number.isFinite(filters.minPrice)) query = query.gte("effective_price", filters.minPrice);
  if (filters.maxPrice !== undefined && Number.isFinite(filters.maxPrice)) query = query.lte("effective_price", filters.maxPrice);
  if (filters.availability === "in_stock") query = query.gt("stock", 0);
  if (filters.availability === "out_of_stock") query = query.eq("stock", 0);

  switch (filters.sort) {
    case "price_asc":
      query = query.order("effective_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("effective_price", { ascending: false });
      break;
    case "popular":
      query = query.order("units_sold", { ascending: false }).order("published_at", { ascending: false });
      break;
    default:
      query = query.order("published_at", { ascending: false, nullsFirst: false });
  }
  query = query.order("id");

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) {
    // Out-of-range pages return 416 from PostgREST — treat as empty.
    if ((error as any).code !== "PGRST103") logError("products", error);
    return { ...empty, total: count ?? 0, pageCount: Math.ceil((count ?? 0) / pageSize) };
  }
  const total = count ?? 0;
  return { products: (data ?? []).map(mapProductSummary), total, page, pageCount: Math.ceil(total / pageSize), pageSize };
}

// ---------------------------------------------------------------------------
// Homepage rails
// ---------------------------------------------------------------------------
async function rail(build: (q: any) => any, limit: number): Promise<ProductSummary[]> {
  if (!isSupabaseConfigured()) return [];
  const base = createPublicClient().from("products").select(PRODUCT_SUMMARY_SELECT).eq("status", "active");
  const { data, error } = await build(base).limit(limit);
  if (error) {
    logError("rail", error);
    return [];
  }
  return (data ?? []).map(mapProductSummary);
}

export const getFeaturedProducts = (limit = 8) =>
  rail((q) => q.eq("is_featured", true).order("published_at", { ascending: false }), limit);

/** Real best sellers: only products with units sold in non-cancelled orders. */
export const getBestSellers = (limit = 8) =>
  rail((q) => q.gt("units_sold", 0).order("units_sold", { ascending: false }), limit);

export const getNewArrivals = (limit = 8) =>
  rail((q) => q.order("published_at", { ascending: false, nullsFirst: false }), limit);

export const getProductsInCategory = (categoryId: string, limit = 4) =>
  rail((q) => q.eq("category_id", categoryId).order("units_sold", { ascending: false }).order("published_at", { ascending: false }), limit);

// ---------------------------------------------------------------------------
// Product detail
// ---------------------------------------------------------------------------
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (error) logError("product", error);
  return data ? mapProduct(data) : null;
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<ProductSummary[]> {
  if (!isSupabaseConfigured()) return [];
  const client = createPublicClient();
  let related: ProductSummary[] = [];
  if (product.category) {
    const { data } = await client
      .from("products")
      .select(PRODUCT_SUMMARY_SELECT)
      .eq("status", "active")
      .eq("category_id", product.category.id)
      .neq("id", product.id)
      .order("units_sold", { ascending: false })
      .limit(limit);
    related = (data ?? []).map(mapProductSummary);
  }
  if (related.length < limit) {
    const exclude = [product.id, ...related.map((p) => p.id)];
    const { data } = await client
      .from("products")
      .select(PRODUCT_SUMMARY_SELECT)
      .eq("status", "active")
      .not("id", "in", `(${exclude.join(",")})`)
      .order("units_sold", { ascending: false })
      .limit(limit - related.length);
    related = related.concat((data ?? []).map(mapProductSummary));
  }
  return related;
}

/** Fresh price/stock for cart lines (used by cart + checkout). */
export async function getProductsByIds(ids: string[]): Promise<ProductSummary[]> {
  if (!isSupabaseConfigured() || ids.length === 0) return [];
  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_SUMMARY_SELECT)
    .eq("status", "active")
    .in("id", ids.slice(0, 100));
  if (error) logError("byIds", error);
  return (data ?? []).map(mapProductSummary);
}

export async function getAllProductSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await createPublicClient()
    .from("products")
    .select("slug,updated_at")
    .eq("status", "active")
    .limit(5000);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Reviews (approved only)
// ---------------------------------------------------------------------------
export async function getProductReviews(productId: string): Promise<{ reviews: Review[]; stats: RatingStats | null }> {
  if (!isSupabaseConfigured()) return { reviews: [], stats: null };
  const client = createPublicClient();
  const [{ data: reviews }, { data: stats }] = await Promise.all([
    client
      .from("reviews")
      .select("id,author_name,rating,title,body,created_at")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(20),
    client.from("product_rating_stats").select("review_count,average_rating").eq("product_id", productId).maybeSingle(),
  ]);
  return {
    reviews: (reviews ?? []) as Review[],
    stats: stats ? { review_count: toNumber(stats.review_count), average_rating: toNumber(stats.average_rating) } : null,
  };
}

export async function getLatestReviews(limit = 6): Promise<(Review & { product: { name: string; slug: string } | null })[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await createPublicClient()
    .from("reviews")
    .select("id,author_name,rating,title,body,created_at,product:products(name,slug)")
    .eq("is_approved", true)
    .gte("rating", 4)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) logError("latestReviews", error);
  return (data ?? []) as any;
}
