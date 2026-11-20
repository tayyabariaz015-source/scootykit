import { describe, expect, it } from "vitest";
import { cartSubtotal, clampQuantity, discountPercent, effectivePrice, isOnSale, orderTotal } from "@/lib/commerce/pricing";
import { formatPKR } from "@/lib/commerce/format";

describe("pricing helpers", () => {
  it("uses sale price only when it is genuinely lower", () => {
    expect(effectivePrice({ price: 3500, sale_price: 2999 })).toBe(2999);
    expect(effectivePrice({ price: 3500, sale_price: null })).toBe(3500);
    expect(effectivePrice({ price: 3500, sale_price: 4000 })).toBe(3500);
    expect(isOnSale({ price: 3500, sale_price: 3500 })).toBe(false);
  });

  it("computes discount percent", () => {
    expect(discountPercent({ price: 1000, sale_price: 750 })).toBe(25);
    expect(discountPercent({ price: 1000, sale_price: null })).toBe(0);
  });

  it("sums cart lines and totals", () => {
    const subtotal = cartSubtotal([
      { price: 3500, sale_price: 2999, quantity: 2 },
      { price: 1200, sale_price: null, quantity: 1 },
    ]);
    expect(subtotal).toBe(7198);
    expect(orderTotal(subtotal, 250, 600)).toBe(6848);
    expect(orderTotal(100, 0, 500)).toBe(0);
  });

  it("clamps quantity to stock and per-line limit", () => {
    expect(clampQuantity(5, 3)).toBe(3);
    expect(clampQuantity(0, 3)).toBe(1);
    expect(clampQuantity(80, 100)).toBe(50);
    expect(clampQuantity(2, 0)).toBe(0);
    expect(clampQuantity(2.7, 10)).toBe(2);
  });

  it("formats PKR", () => {
    expect(formatPKR(1250)).toBe("Rs. 1,250");
    expect(formatPKR(1249.6)).toBe("Rs. 1,250");
  });
});
