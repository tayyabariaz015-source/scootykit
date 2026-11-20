export type ProductStatus = "draft" | "active" | "archived";
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "unpaid" | "awaiting_verification" | "paid" | "refunded" | "failed";
export type PaymentMethod = "cod" | "bank_transfer";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  icon: string;
  sort_order: number;
  is_visible: boolean;
  seo_title: string | null;
  seo_description: string | null;
  product_count?: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  sort_order: number;
  storage_path?: string | null;
}

export interface ProductSpec {
  id?: string;
  label: string;
  value: string;
  sort_order?: number;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  stock: number;
  is_featured: boolean;
  short_description: string;
  image: ProductImage | null;
  category: Pick<Category, "id" | "name" | "slug"> | null;
}

export interface Product extends ProductSummary {
  sku: string | null;
  description: string;
  features: string[];
  status: ProductStatus;
  low_stock_threshold: number;
  images: ProductImage[];
  specifications: ProductSpec[];
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  created_at: string;
}

export interface RatingStats {
  review_count: number;
  average_rating: number;
}

export interface StoreSettings {
  store_name: string;
  tagline: string;
  announcement_text: string | null;
  announcement_link: string | null;
  announcement_active: boolean;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  business_address: string | null;
  business_hours: string | null;
  bank_transfer_enabled: boolean;
  bank_name: string | null;
  bank_account_title: string | null;
  bank_account_number: string | null;
  bank_iban: string | null;
  bank_instructions: string | null;
  cod_enabled: boolean;
  free_delivery_threshold: number | null;
  delivery_estimate_text: string | null;
  hero_image_url: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_tiktok: string | null;
}

export interface DeliveryZone {
  id: string;
  name: string;
  province: string | null;
  city: string | null;
  charge: number;
  is_active: boolean;
  sort_order: number;
}

export interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string | null;
  sku: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface OrderStatusEvent {
  id?: string;
  status: OrderStatus;
  payment_status?: PaymentStatus;
  note?: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  province: string;
  city: string;
  address: string;
  notes: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  status: OrderStatus;
  subtotal: number;
  delivery_charge: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  history?: OrderStatusEvent[];
}

export interface Address {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  province: string;
  city: string;
  address_line: string;
  is_default: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  per_customer_limit: number | null;
  times_used: number;
  is_active: boolean;
  created_at: string;
}

/** Standard result shape returned by server actions. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
