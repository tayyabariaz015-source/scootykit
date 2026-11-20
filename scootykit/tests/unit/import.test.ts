import { describe, expect, it } from "vitest";
import { mapRecords, normalizeHeader, validateImportRows } from "@/lib/commerce/import";

const categories = [
  { id: "c1", name: "Scooty Helmets", slug: "scooty-helmets" },
  { id: "c2", name: "GPS Trackers", slug: "gps-trackers" },
];

describe("product import", () => {
  it("recognises common header aliases", () => {
    expect(normalizeHeader("Product Name")).toBe("name");
    expect(normalizeHeader("Selling Price (PKR)")).toBe("selling_price");
    expect(normalizeHeader("Qty")).toBe("stock");
    expect(normalizeHeader("Supplier URL")).toBe("supplier_url");
    expect(normalizeHeader("random")).toBeNull();
  });

  it("validates rows, detects duplicate SKUs and existing SKUs", () => {
    const { rows, unknownHeaders } = mapRecords([
      { "Product Name": "Helmet A", Category: "Scooty Helmets", SKU: "hel-1", "Cost Price": "1,800", Price: "Rs. 3,499", Qty: "10", Specs: "Material: ABS; Size: M", Images: "https://a.com/1.jpg | https://a.com/2.jpg", Extra: "x" },
      { "Product Name": "Helmet B", Category: "scooty-helmets", SKU: "HEL-1", Price: "2000", Qty: "3" },
      { "Product Name": "Tracker", Category: "Unknown cat", SKU: "GPS-9", Price: "abc", Qty: "-1" },
      { "Product Name": "", SKU: "OLD-1" },
    ]);
    expect(unknownHeaders).toEqual(["Extra"]);
    const parsed = validateImportRows(rows, categories, new Set(["old-1"]));

    expect(parsed[0].errors).toEqual([]);
    expect(parsed[0].categoryId).toBe("c1");
    expect(parsed[0].sellingPrice).toBe(3499);
    expect(parsed[0].costPrice).toBe(1800);
    expect(parsed[0].specifications).toEqual([
      { label: "Material", value: "ABS" },
      { label: "Size", value: "M" },
    ]);
    expect(parsed[0].imageUrls).toHaveLength(2);
    expect(parsed[0].warnings.some((w) => w.includes("private references"))).toBe(true);

    expect(parsed[1].categoryId).toBe("c1");
    expect(parsed[1].errors.some((e) => e.includes("Duplicate SKU HEL-1"))).toBe(true);

    expect(parsed[2].errors).toContain("Selling price is not a valid number");
    expect(parsed[2].errors.some((e) => e.includes("Stock"))).toBe(true);
    expect(parsed[2].warnings.some((w) => w.includes("Unknown category"))).toBe(true);

    expect(parsed[3].errors).toContain("Product name is required");
    expect(parsed[3].errors.some((e) => e.includes("already exists"))).toBe(true);
  });
});
