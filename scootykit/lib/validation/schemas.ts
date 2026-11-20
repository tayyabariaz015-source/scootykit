import { z } from "zod";
import { normalizePakistaniPhone } from "@/lib/commerce/phone";
import { PROVINCES } from "@/lib/commerce/pakistan";
import { isValidSlug } from "@/lib/commerce/slug";

// ---------------------------------------------------------------------------
// Shared field builders
// ---------------------------------------------------------------------------
export const phoneField = z
  .string()
  .trim()
  .min(1, "Mobile number is required")
  .refine((v) => normalizePakistaniPhone(v) !== null, {
    message: "Enter a valid Pakistani mobile number, e.g. 03001234567 or +923001234567",
  });

const optionalEmail = z
  .string()
  .trim()
  .max(160)
  .refine((v) => v === "" || z.email().safeParse(v).success, { message: "Enter a valid email address" });

const provinceField = z.enum(PROVINCES, { message: "Select your province" });

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------
export const checkoutFormSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: phoneField,
  email: optionalEmail,
  province: provinceField,
  city: z.string().trim().min(2, "Enter your city").max(80),
  address: z.string().trim().min(8, "Enter your complete address (house, street, area)").max(400),
  notes: z.string().trim().max(500, "Keep notes under 500 characters"),
  payment_method: z.enum(["cod", "bank_transfer"], { message: "Choose a payment method" }),
  coupon_code: z.string().trim().max(32),
});
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const cartLineSchema = z.object({
  product_id: z.uuid(),
  quantity: z.number().int().min(1).max(50),
});

export const placeOrderSchema = checkoutFormSchema.extend({
  idempotency_key: z.string().min(16).max(100),
  items: z.array(cartLineSchema).min(1, "Your cart is empty").max(50),
});
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export const trackOrderSchema = z.object({
  order_number: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^SK-\d{6}-[A-Z0-9]{5}$/, "Order numbers look like SK-261119-AB2CD"),
  phone: phoneField,
});
export type TrackOrderValues = z.input<typeof trackOrderSchema>;

// ---------------------------------------------------------------------------
// Auth & account
// ---------------------------------------------------------------------------
export const loginSchema = z.object({
  email: z.email("Enter a valid email address").trim(),
  password: z.string().min(1, "Enter your password"),
});
export type LoginValues = z.infer<typeof loginSchema>;

const passwordField = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your full name").max(120),
    email: z.email("Enter a valid email address").trim(),
    phone: z
      .string()
      .trim()
      .refine((v) => v === "" || normalizePakistaniPhone(v) !== null, { message: "Enter a valid Pakistani mobile number" }),
    password: passwordField,
    confirm_password: z.string(),
  })
  .refine((v) => v.password === v.confirm_password, { message: "Passwords don't match", path: ["confirm_password"] });
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email: z.email("Enter a valid email address").trim() });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({ password: passwordField, confirm_password: z.string() })
  .refine((v) => v.password === v.confirm_password, { message: "Passwords don't match", path: ["confirm_password"] });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || normalizePakistaniPhone(v) !== null, { message: "Enter a valid Pakistani mobile number" }),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Give this address a label").max(40),
  full_name: z.string().trim().min(2, "Enter the recipient's name").max(120),
  phone: phoneField,
  province: provinceField,
  city: z.string().trim().min(2, "Enter the city").max(80),
  address_line: z.string().trim().min(8, "Enter the complete address").max(400),
  is_default: z.boolean(),
});
export type AddressValues = z.infer<typeof addressSchema>;

// ---------------------------------------------------------------------------
// Engagement
// ---------------------------------------------------------------------------
export const newsletterSchema = z.object({ email: z.email("Enter a valid email address").trim().toLowerCase() });

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: optionalEmail,
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || normalizePakistaniPhone(v) !== null, { message: "Enter a valid Pakistani mobile number" }),
  subject: z.string().trim().max(160),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(3000),
});
export type ContactValues = z.infer<typeof contactSchema>;

export const reviewSchema = z.object({
  product_id: z.uuid(),
  rating: z.number().int().min(1, "Choose a rating").max(5),
  title: z.string().trim().max(120),
  body: z.string().trim().min(10, "Write at least 10 characters").max(2000),
});
export type ReviewValues = z.infer<typeof reviewSchema>;

// ---------------------------------------------------------------------------
// Admin (parsed from FormData on the server)
// ---------------------------------------------------------------------------
const money = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .transform((v) => Number(v.replace(/,/g, "")))
    .pipe(z.number({ message: `${label} must be a number` }).min(0, `${label} can't be negative`).max(10_000_000));

const optionalMoney = (label: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v.replace(/,/g, ""))))
    .pipe(z.number({ message: `${label} must be a number` }).min(0).max(10_000_000).nullable());

const intField = (label: string, min = 0) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().int(`${label} must be a whole number`).min(min, `${label} can't be below ${min}`).max(1_000_000));

const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .max(120)
  .refine((v) => v === "" || isValidSlug(v), { message: "Use lowercase letters, numbers and hyphens only" });

const optionalText = (max: number) => z.string().trim().max(max).transform((v) => (v === "" ? null : v));

export const productAdminSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(160),
    slug: slugField,
    sku: optionalText(64),
    category_id: z.string().transform((v) => (v === "" ? null : v)).pipe(z.uuid().nullable()),
    short_description: z.string().trim().max(300),
    description: z.string().trim().max(10000),
    features: z.string().transform((v) =>
      v
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean)
        .slice(0, 20),
    ),
    price: money("Price"),
    sale_price: optionalMoney("Sale price"),
    stock: intField("Stock"),
    low_stock_threshold: intField("Low-stock threshold"),
    status: z.enum(["draft", "active", "archived"]),
    is_featured: z.boolean(),
    seo_title: optionalText(70),
    seo_description: optionalText(170),
    specifications: z
      .string()
      .transform((v, ctx) => {
        try {
          const parsed = JSON.parse(v || "[]");
          return z
            .array(z.object({ label: z.string().trim().min(1).max(80), value: z.string().trim().min(1).max(300) }))
            .max(40)
            .parse(parsed);
        } catch {
          ctx.addIssue({ code: "custom", message: "Specifications are invalid" });
          return z.NEVER;
        }
      }),
    cost_price: optionalMoney("Cost price"),
    supplier_name: optionalText(160),
    supplier_url: z
      .string()
      .trim()
      .max(1000)
      .refine((v) => v === "" || /^https?:\/\//i.test(v), { message: "Supplier URL must start with http(s)://" })
      .transform((v) => (v === "" ? null : v)),
  })
  .superRefine((v, ctx) => {
    if (v.sale_price !== null && v.sale_price >= v.price) {
      ctx.addIssue({ code: "custom", path: ["sale_price"], message: "Sale price must be lower than the regular price" });
    }
    if (v.status === "active" && v.price <= 0) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Set a real selling price before publishing" });
    }
  });
export type ProductAdminInput = z.infer<typeof productAdminSchema>;

export const categoryAdminSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  slug: slugField,
  description: z.string().trim().max(1000),
  icon: z.string().trim().max(40).transform((v) => v || "package"),
  sort_order: intField("Sort order"),
  is_visible: z.boolean(),
  seo_title: optionalText(70),
  seo_description: optionalText(170),
});

export const couponAdminSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,32}$/, "3–32 characters: letters, numbers, - or _"),
    description: optionalText(200),
    discount_type: z.enum(["percent", "fixed"]),
    discount_value: money("Discount value"),
    min_order_amount: money("Minimum order"),
    max_discount: optionalMoney("Maximum discount"),
    starts_at: z.string().trim().transform((v) => (v === "" ? null : new Date(v).toISOString())),
    expires_at: z.string().trim().transform((v) => (v === "" ? null : new Date(v).toISOString())),
    usage_limit: z.string().trim().transform((v) => (v === "" ? null : Number(v))).pipe(z.number().int().min(1).nullable()),
    per_customer_limit: z.string().trim().transform((v) => (v === "" ? null : Number(v))).pipe(z.number().int().min(1).nullable()),
    is_active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.discount_value <= 0) ctx.addIssue({ code: "custom", path: ["discount_value"], message: "Must be greater than 0" });
    if (v.discount_type === "percent" && v.discount_value > 100) {
      ctx.addIssue({ code: "custom", path: ["discount_value"], message: "Percent discount can't exceed 100" });
    }
    if (v.starts_at && v.expires_at && v.starts_at >= v.expires_at) {
      ctx.addIssue({ code: "custom", path: ["expires_at"], message: "Expiry must be after the start date" });
    }
  });

export const deliveryZoneSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(80),
    province: z.string().trim().transform((v) => (v === "" ? null : v)),
    city: z.string().trim().max(80).transform((v) => (v === "" ? null : v)),
    charge: money("Charge"),
    is_active: z.boolean(),
  })
  .refine((v) => v.city === null || v.province !== null, { message: "Choose a province for a city-specific zone", path: ["province"] });

const urlOrEmpty = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\//i.test(v) || v.startsWith("/"), { message: "Enter a full URL (https://…) or a site path (/shop)" })
  .transform((v) => (v === "" ? null : v));

export const settingsSchema = z.object({
  announcement_text: optionalText(160),
  announcement_link: urlOrEmpty,
  announcement_active: z.boolean(),
  contact_email: optionalText(160),
  contact_phone: optionalText(40),
  whatsapp_number: optionalText(40),
  business_address: optionalText(300),
  business_hours: optionalText(120),
  cod_enabled: z.boolean(),
  bank_transfer_enabled: z.boolean(),
  bank_name: optionalText(120),
  bank_account_title: optionalText(120),
  bank_account_number: optionalText(60),
  bank_iban: optionalText(40),
  bank_instructions: optionalText(500),
  free_delivery_threshold: optionalMoney("Free delivery threshold"),
  delivery_estimate_text: optionalText(160),
  hero_image_url: urlOrEmpty,
  social_facebook: urlOrEmpty,
  social_instagram: urlOrEmpty,
  social_tiktok: urlOrEmpty,
});

export const orderUpdateSchema = z.object({
  order_id: z.uuid(),
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
  payment_status: z.enum(["unpaid", "awaiting_verification", "paid", "refunded", "failed"]),
  note: z.string().trim().max(500),
});
