"use client";
import Form from "next/form";
import Link from "next/link";
import { useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { ParsedListingParams } from "./listing";

const SORT_LABELS: Record<string, string> = {
  newest: "Newest",
  popular: "Popularity",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
};

export function FiltersPanel({
  basePath,
  params,
  categories,
  resultCount,
}: {
  basePath: string;
  params: ParsedListingParams;
  categories: { slug: string; name: string; count: number }[];
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const activeCount =
    (params.min ? 1 : 0) + (params.max ? 1 : 0) + (params.stock ? 1 : 0) + params.categories.filter((c) => categories.some((x) => x.slug === c)).length;

  const fields = (
    <>
      {params.q && <input type="hidden" name="q" value={params.q} />}
      <div className="space-y-6">
        {categories.length > 0 && (
          <fieldset>
            <legend className="mb-2.5 text-sm font-bold">Category</legend>
            <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
              {categories.map((c) => (
                <label key={c.slug} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm hover:bg-surface">
                  <input type="checkbox" name="category" value={c.slug} defaultChecked={params.categories.includes(c.slug)} className="h-4 w-4 accent-coral-500" />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs text-muted">{c.count}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <fieldset>
          <legend className="mb-2.5 text-sm font-bold">Price (Rs.)</legend>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="f-min" className="sr-only">
                Minimum price
              </Label>
              <Input id="f-min" name="min" inputMode="numeric" pattern="[0-9]*" placeholder="Min" defaultValue={params.min} />
            </div>
            <div>
              <Label htmlFor="f-max" className="sr-only">
                Maximum price
              </Label>
              <Input id="f-max" name="max" inputMode="numeric" pattern="[0-9]*" placeholder="Max" defaultValue={params.max} />
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2.5 text-sm font-bold">Availability</legend>
          <div className="space-y-1">
            {[
              { v: "", l: "All products" },
              { v: "in_stock", l: "In stock" },
              { v: "out_of_stock", l: "Out of stock" },
            ].map((o) => (
              <label key={o.v || "all"} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm hover:bg-surface">
                <input type="radio" name="stock" value={o.v} defaultChecked={params.stock === o.v} className="h-4 w-4 accent-coral-500" />
                {o.l}
              </label>
            ))}
          </div>
        </fieldset>
        <input type="hidden" name="sort" value={params.sort} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            Apply filters
          </Button>
          {activeCount > 0 && (
            <Link href={params.q ? `${basePath}?q=${encodeURIComponent(params.q)}` : basePath} className="inline-flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-coral-600 hover:bg-coral-50">
              Clear
            </Link>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Toolbar: result count + sort + mobile filter toggle */}
      <div className="flex items-center justify-between gap-3 lg:col-span-2">
        <p className="text-sm text-muted" aria-live="polite">
          <span className="font-semibold text-navy-900">{resultCount}</span> {resultCount === 1 ? "product" : "products"}
          {params.q && (
            <>
              {" "}
              for “<span className="font-semibold text-navy-900">{params.q}</span>”
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-3.5 text-sm font-semibold lg:hidden"
            aria-expanded={open}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters{activeCount > 0 && <span className="rounded-full bg-coral-500 px-1.5 text-xs text-white">{activeCount}</span>}
          </button>
          <Form action={basePath} ref={formRef} className="contents">
            {params.q && <input type="hidden" name="q" value={params.q} />}
            {params.categories.map((c) => (
              <input key={c} type="hidden" name="category" value={c} />
            ))}
            {params.min && <input type="hidden" name="min" value={params.min} />}
            {params.max && <input type="hidden" name="max" value={params.max} />}
            {params.stock && <input type="hidden" name="stock" value={params.stock} />}
            <label htmlFor="sort" className="sr-only">
              Sort products
            </label>
            <Select id="sort" name="sort" defaultValue={params.sort} onChange={() => formRef.current?.requestSubmit()} className="w-auto min-w-44">
              {Object.entries(SORT_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
            <noscript>
              <Button type="submit" variant="outline">
                Sort
              </Button>
            </noscript>
          </Form>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block" aria-label="Filters">
        <Form action={basePath} className="sticky top-36 rounded-2xl border border-line bg-white p-5">
          <h2 className="mb-5 text-base font-bold">Filters</h2>
          {fields}
        </Form>
      </aside>

      {/* Mobile sheet */}
      <div className={cn("fixed inset-0 z-[70] lg:hidden", open ? "" : "pointer-events-none invisible")} aria-hidden={!open}>
        <button className={cn("absolute inset-0 bg-navy-950/50 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} aria-label="Close filters" tabIndex={open ? 0 : -1} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          className={cn("absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 transition-transform", open ? "translate-y-0" : "translate-y-full")}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold">Filters</h2>
            <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface" aria-label="Close filters" tabIndex={open ? 0 : -1}>
              <X className="h-5 w-5" />
            </button>
          </div>
          {open && (
            <Form action={basePath} onSubmit={() => setOpen(false)}>
              {fields}
            </Form>
          )}
        </div>
      </div>
    </>
  );
}
