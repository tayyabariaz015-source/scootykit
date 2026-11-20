import type { MetadataRoute } from "next";
import { getAllProductSlugs, getCategories } from "@/lib/data/catalog";
import { SITE_URL } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getAllProductSlugs()]);
  const staticPages = ["", "/shop", "/categories", "/about", "/contact", "/faq", "/shipping-policy", "/returns", "/privacy", "/terms", "/track-order"];
  return [
    ...staticPages.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: p === "" ? ("daily" as const) : ("monthly" as const), priority: p === "" ? 1 : 0.5 })),
    ...categories.map((c) => ({ url: `${SITE_URL}/category/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
