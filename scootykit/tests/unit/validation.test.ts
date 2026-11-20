import { describe, expect, it } from "vitest";
import { checkoutFormSchema, placeOrderSchema, productAdminSchema, registerSchema, trackOrderSchema } from "@/lib/validation/schemas";
import { safeNext } from "@/lib/auth/redirect";
import { orderErrorMessage } from "@/lib/commerce/errors";
import { slugify } from "@/lib/commerce/slug";
import { resolveDeliveryCharge } from "@/lib/data/settings";

const validCheckout = {
  full_name: "Ayesha Khan",
  phone: "+923001234567",
  email: "",
  province: "Punjab",
  city: "Lahore",
  address: "House 12, Street 4, Model Town",
  notes: "",
  payment_method: "cod",
  coupon_code: "",
};

describe("checkout validation", () => {
  it("accepts a valid checkout", () => {
    expect(checkoutFormSchema.safeParse(validCheckout).success).toBe(true);
  });
  it("rejects bad phone, province and short address", () => {
    const r = checkoutFormSchema.safeParse({ ...validCheckout, phone: "0423576123", province: "Texas", address: "Lahore" });
    expect(r.success).toBe(false);
    const paths = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["phone", "province", "address"]));
  });
  it("requires items and an idempotency key to place an order", () => {
    expect(placeOrderSchema.safeParse({ ...validCheckout, items: [], idempotency_key: "short" }).success).toBe(false);
    expect(
      placeOrderSchema.safeParse({
        ...validCheckout,
        items: [{ product_id: "10000000-0000-4000-8000-000000000001", quantity: 2 }],
        idempotency_key: "3b0f1c1e-1d5e-4a1a-9a43-2a7a0d4b1f00",
      }).success,
    ).toBe(true);
    expect(
      placeOrderSchema.safeParse({
        ...validCheckout,
        items: [{ product_id: "10000000-0000-4000-8000-000000000001", quantity: 51 }],
        idempotency_key: "3b0f1c1e-1d5e-4a1a-9a43-2a7a0d4b1f00",
      }).success,
    ).toBe(false);
  });
});

describe("other schemas", () => {
  it("validates tracking input", () => {
    expect(trackOrderSchema.safeParse({ order_number: "sk-261119-ab2cd", phone: "03001234567" }).success).toBe(true);
    expect(trackOrderSchema.safeParse({ order_number: "12345", phone: "03001234567" }).success).toBe(false);
  });
  it("enforces password rules and matching", () => {
    const base = { full_name: "Ali", email: "ali@example.com", phone: "", password: "secret123", confirm_password: "secret123" };
    expect(registerSchema.safeParse(base).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, password: "short1", confirm_password: "short1" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, confirm_password: "other123" }).success).toBe(false);
  });
  it("admin product: sale must be below price; active needs a price", () => {
    const base = {
      name: "Helmet",
      slug: "",
      sku: "",
      category_id: "",
      short_description: "",
      description: "",
      features: "A\n\nB",
      price: "3500",
      sale_price: "",
      stock: "5",
      low_stock_threshold: "5",
      status: "draft",
      is_featured: false,
      seo_title: "",
      seo_description: "",
      specifications: '[{"label":"Material","value":"ABS"}]',
      cost_price: "",
      supplier_name: "",
      supplier_url: "",
    };
    const ok = productAdminSchema.safeParse(base);
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.features).toEqual(["A", "B"]);
    expect(productAdminSchema.safeParse({ ...base, sale_price: "4000" }).success).toBe(false);
    expect(productAdminSchema.safeParse({ ...base, price: "0", status: "active" }).success).toBe(false);
    expect(productAdminSchema.safeParse({ ...base, specifications: "not json" }).success).toBe(false);
  });
});

describe("misc helpers", () => {
  it("prevents open redirects", () => {
    expect(safeNext("/account/orders")).toBe("/account/orders");
    expect(safeNext("//evil.com")).toBe("/account");
    expect(safeNext("https://evil.com")).toBe("/account");
    expect(safeNext("/\\evil.com")).toBe("/account");
    expect(safeNext(undefined)).toBe("/account");
  });
  it("maps database order errors to friendly messages", () => {
    expect(orderErrorMessage("OUT_OF_STOCK:Test Lock")).toContain("Test Lock");
    expect(orderErrorMessage("COUPON_EXPIRED")).toContain("expired");
    expect(orderErrorMessage("something else")).toContain("couldn't place");
  });
  it("slugifies", () => {
    expect(slugify("Scooty Stickers & Decals")).toBe("scooty-stickers-and-decals");
    expect(slugify("  Helmet — Pro 2.0!! ")).toBe("helmet-pro-2-0");
  });
  it("resolves delivery charge like the database", () => {
    const zones = [
      { id: "1", name: "Default", province: null, city: null, charge: 250, is_active: true, sort_order: 0 },
      { id: "2", name: "Sindh", province: "Sindh", city: null, charge: 200, is_active: true, sort_order: 0 },
      { id: "3", name: "Karachi", province: "Sindh", city: "Karachi", charge: 150, is_active: true, sort_order: 0 },
    ];
    expect(resolveDeliveryCharge(zones, "Sindh", "karachi", 1000, null)).toBe(150);
    expect(resolveDeliveryCharge(zones, "Sindh", "Hyderabad", 1000, null)).toBe(200);
    expect(resolveDeliveryCharge(zones, "Punjab", "Lahore", 1000, null)).toBe(250);
    expect(resolveDeliveryCharge(zones, "Punjab", "Lahore", 5000, 5000)).toBe(0);
    expect(resolveDeliveryCharge([], "Punjab", "Lahore", 1000, null)).toBeNull();
  });
});
