import "server-only";
import { createClient } from "@/lib/supabase/server";
import { escapeLike, toNullableNumber, toNumber } from "@/lib/utils";
import { mapOrder } from "./account";
import type { Category, Coupon, DeliveryZone, Order, ProductImage, ProductSpec, ProductStatus } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
// All functions run with the admin's session; RLS (is_admin) authorises every query.

export interface AdminStats {
  total_orders: number;
  total_products: number;
  active_products: number;
  total_customers: number;
  total_sales: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  awaiting_payment: number;
  low_stock: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  const d = (data ?? {}) as Record<string, unknown>;
  if (error) console.error("[admin:stats]", error);
  const n = (k: string) => toNumber(d[k]);
  return {
    total_orders: n("total_orders"),
    total_products: n("total_products"),
    active_products: n("active_products"),
    total_customers: n("total_customers"),
    total_sales: n("total_sales"),
    pending_orders: n("pending_orders"),
    completed_orders: n("completed_orders"),
    cancelled_orders: n("cancelled_orders"),
    awaiting_payment: n("awaiting_payment"),
    low_stock: n("low_stock"),
  };
}

export async function getSalesSeries(days = 30): Promise<{ day: string; orders: number; revenue: number }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_sales_series", { p_days: days });
  if (error) console.error("[admin:series]", error);
  return (data ?? []).map((r: any) => ({ day: r.day, orders: toNumber(r.orders), revenue: toNumber(r.revenue) }));
}

export async function getTopProducts(limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("id,name,units_sold,stock").gt("units_sold", 0).order("units_sold", { ascending: false }).limit(limit);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  sale_price: number | null;
  stock: number;
  low_stock_threshold: number;
  status: ProductStatus;
  is_featured: boolean;
  units_sold: number;
  updated_at: string;
  category: { name: string } | null;
  image: string | null;
}

export async function getAdminProducts(opts: { q?: string; status?: string; category?: string; lowStock?: boolean; page?: number; pageSize?: number }) {
  const supabase = await createClient();
  const pageSize = opts.pageSize ?? 25;
  const page = Math.max(opts.page ?? 1, 1);
  let query = supabase
    .from("products")
    .select("id,name,slug,sku,price,sale_price,stock,low_stock_threshold,status,is_featured,units_sold,updated_at,category:categories(name),images:product_images(url,sort_order)", { count: "exact" });
  if (opts.q) {
    const q = escapeLike(opts.q.slice(0, 80)).replace(/[,()]/g, " ");
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }
  if (opts.status && ["draft", "active", "archived"].includes(opts.status)) query = query.eq("status", opts.status);
  else query = query.neq("status", "archived");
  if (opts.category) query = query.eq("category_id", opts.category);
  if (opts.lowStock) query = query.lte("stock", 5);
  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.order("updated_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error && (error as any).code !== "PGRST103") console.error("[admin:products]", error);
  const rows: AdminProductRow[] = (data ?? []).map((r: any) => ({
    ...r,
    price: toNumber(r.price),
    sale_price: toNullableNumber(r.sale_price),
    image: [...(r.images ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url ?? null,
  }));
  return { rows, total: count ?? 0, page, pageCount: Math.ceil((count ?? 0) / pageSize) };
}

export interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  category_id: string | null;
  short_description: string;
  description: string;
  features: string[];
  price: number;
  sale_price: number | null;
  stock: number;
  low_stock_threshold: number;
  status: ProductStatus;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  units_sold: number;
  images: (ProductImage & { storage_path: string | null })[];
  specifications: ProductSpec[];
  sourcing: { supplier_name: string | null; supplier_url: string | null; cost_price: number | null; supplier_image_urls: string[]; notes: string | null } | null;
}

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "*, images:product_images(id,url,alt,sort_order,storage_path), specifications:product_specifications(id,label,value,sort_order), sourcing:product_sourcing(supplier_name,supplier_url,cost_price,supplier_image_urls,notes)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const sourcing = Array.isArray(data.sourcing) ? data.sourcing[0] : data.sourcing;
  return {
    ...data,
    price: toNumber(data.price),
    sale_price: toNullableNumber(data.sale_price),
    images: [...(data.images ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order),
    specifications: [...(data.specifications ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order),
    sourcing: sourcing ? { ...sourcing, cost_price: toNullableNumber(sourcing.cost_price) } : null,
  } as AdminProductDetail;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export async function getAdminCategories(): Promise<(Category & { total_products: number })[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*, products(count)").order("sort_order").order("name");
  return (data ?? []).map((c: any) => ({ ...c, total_products: toNumber(c.products?.[0]?.count), product_count: toNumber(c.products?.[0]?.count) }));
}

export async function getAdminCategory(id: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
  return (data as Category) ?? null;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export async function getAdminOrders(opts: { q?: string; status?: string; payment?: string; page?: number; pageSize?: number }) {
  const supabase = await createClient();
  const pageSize = opts.pageSize ?? 25;
  const page = Math.max(opts.page ?? 1, 1);
  let query = supabase
    .from("orders")
    .select("id,order_number,customer_name,phone,city,status,payment_status,payment_method,total,created_at", { count: "exact" });
  if (opts.q) {
    const q = escapeLike(opts.q.trim().slice(0, 60)).replace(/[,()]/g, " ");
    query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%`);
  }
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.payment) query = query.eq("payment_status", opts.payment);
  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error && (error as any).code !== "PGRST103") console.error("[admin:orders]", error);
  return {
    rows: (data ?? []).map((o: any) => ({ ...o, total: toNumber(o.total) })) as Pick<
      Order,
      "id" | "order_number" | "customer_name" | "phone" | "city" | "status" | "payment_status" | "payment_method" | "total" | "created_at"
    >[],
    total: count ?? 0,
    page,
    pageCount: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getRecentOrders(limit = 6) {
  return (await getAdminOrders({ pageSize: limit })).rows;
}

export async function getAdminOrder(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, items:order_items(*), history:order_status_history(id,status,payment_status,note,created_at)")
    .eq("id", id)
    .maybeSingle();
  return data ? mapOrder(data) : null;
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
export async function getAdminCustomers(opts: { q?: string; page?: number }) {
  const supabase = await createClient();
  const pageSize = 25;
  const page = Math.max(opts.page ?? 1, 1);
  let query = supabase.from("profiles").select("id,full_name,email,phone,created_at", { count: "exact" });
  if (opts.q) {
    const q = escapeLike(opts.q.slice(0, 60)).replace(/[,()]/g, " ");
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  const from = (page - 1) * pageSize;
  const { data: profiles, count } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  const ids = (profiles ?? []).map((p) => p.id);
  const stats = new Map<string, { orders: number; spent: number; last: string | null }>();
  if (ids.length) {
    const { data: orders } = await supabase.from("orders").select("user_id,total,status,created_at").in("user_id", ids);
    for (const o of orders ?? []) {
      const s = stats.get(o.user_id) ?? { orders: 0, spent: 0, last: null };
      s.orders += 1;
      if (o.status !== "cancelled") s.spent += toNumber(o.total);
      if (!s.last || o.created_at > s.last) s.last = o.created_at;
      stats.set(o.user_id, s);
    }
  }
  return {
    rows: (profiles ?? []).map((p) => ({ ...p, ...(stats.get(p.id) ?? { orders: 0, spent: 0, last: null }) })),
    total: count ?? 0,
    page,
    pageCount: Math.ceil((count ?? 0) / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Coupons, delivery, newsletter, reviews, messages
// ---------------------------------------------------------------------------
export async function getCoupons(): Promise<Coupon[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  return (data ?? []).map((c: any) => ({
    ...c,
    discount_value: toNumber(c.discount_value),
    min_order_amount: toNumber(c.min_order_amount),
    max_discount: toNullableNumber(c.max_discount),
  }));
}

export async function getCoupon(id: string): Promise<Coupon | null> {
  return (await getCoupons()).find((c) => c.id === id) ?? null;
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("delivery_zones").select("*").order("province", { nullsFirst: true }).order("city", { nullsFirst: true });
  return (data ?? []).map((z: any) => ({ ...z, charge: toNumber(z.charge) }));
}

export async function getSubscribers(page = 1) {
  const supabase = await createClient();
  const pageSize = 50;
  const from = (page - 1) * pageSize;
  const { data, count } = await supabase
    .from("newsletter_subscribers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  return { rows: data ?? [], total: count ?? 0, page, pageCount: Math.ceil((count ?? 0) / pageSize) };
}

export async function getAdminReviews(filter: "pending" | "approved" | "all") {
  const supabase = await createClient();
  let query = supabase.from("reviews").select("id,author_name,rating,title,body,is_approved,created_at,product:products(name,slug)").order("created_at", { ascending: false }).limit(200);
  if (filter === "pending") query = query.eq("is_approved", false);
  if (filter === "approved") query = query.eq("is_approved", true);
  const { data } = await query;
  return (data ?? []) as any[];
}

export async function getMessages() {
  const supabase = await createClient();
  const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
  return data ?? [];
}

export async function getAllSkus(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("sku").not("sku", "is", null).limit(10000);
  return (data ?? []).map((r) => r.sku as string);
}
