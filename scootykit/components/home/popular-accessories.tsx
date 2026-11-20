"use client";
import { useState } from "react";
import { ProductGrid } from "@/components/products/product-card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/types";

export interface AccessoryTab {
  slug: string;
  name: string;
  icon: string;
  products: ProductSummary[];
}

export function PopularAccessoriesTabs({ tabs }: { tabs: AccessoryTab[] }) {
  const [active, setActive] = useState(tabs[0]?.slug);
  const current = tabs.find((t) => t.slug === active) ?? tabs[0];
  if (!current) return null;
  return (
    <div>
      <div role="tablist" aria-label="Accessory types" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {tabs.map((t) => (
          <button
            key={t.slug}
            role="tab"
            id={`tab-${t.slug}`}
            aria-selected={t.slug === current.slug}
            aria-controls={`panel-${t.slug}`}
            onClick={() => setActive(t.slug)}
            className={cn(
              "flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
              t.slug === current.slug ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white text-navy-800 hover:border-navy-900/30",
            )}
          >
            <CategoryIcon name={t.icon} className="h-4 w-4" />
            {t.name}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${current.slug}`} aria-labelledby={`tab-${current.slug}`}>
        <ProductGrid products={current.products} />
      </div>
    </div>
  );
}
