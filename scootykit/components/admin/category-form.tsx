"use client";
import Image from "next/image";
import { useActionState, useState } from "react";
import { saveCategory } from "@/lib/actions/admin/store";
import { slugify } from "@/lib/commerce/slug";
import { Button } from "@/components/ui/button";
import { CategoryIcon, CATEGORY_ICON_NAMES } from "@/components/ui/category-icon";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import type { ActionResult, Category } from "@/types";
import { FormMessage, Panel } from "./ui";

export function CategoryForm({ category }: { category: Category | null }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(saveCategory.bind(null, category?.id ?? null), null);
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k]?.[0] : undefined);
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [icon, setIcon] = useState(category?.icon ?? "package");

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[1fr_320px]" noValidate>
      <div className="space-y-6">
        <FormMessage state={state} />
        <Panel title="Category details">
          <div className="grid gap-4">
            <Field label="Name" htmlFor="name" error={err("name")} required>
              <Input id="name" name="name" defaultValue={category?.name} onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))} />
            </Field>
            <Field label="URL slug" htmlFor="slug" error={err("slug")} hint={`/category/${slug || "…"} — changing this breaks existing links`}>
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase());
                }}
              />
            </Field>
            <Field label="Description" htmlFor="description" error={err("description")}>
              <Textarea id="description" name="description" rows={3} defaultValue={category?.description} />
            </Field>
            <Field label="SEO title" htmlFor="seo_title" error={err("seo_title")}>
              <Input id="seo_title" name="seo_title" maxLength={70} defaultValue={category?.seo_title ?? ""} />
            </Field>
            <Field label="SEO description" htmlFor="seo_description" error={err("seo_description")}>
              <Textarea id="seo_description" name="seo_description" rows={2} maxLength={170} defaultValue={category?.seo_description ?? ""} />
            </Field>
          </div>
        </Panel>
      </div>
      <div className="space-y-6">
        <Panel title="Display">
          <div className="space-y-4">
            <Checkbox name="is_visible" defaultChecked={category?.is_visible ?? true} label="Visible in store" />
            <Field label="Sort order" htmlFor="sort_order" error={err("sort_order")}>
              <Input id="sort_order" name="sort_order" inputMode="numeric" defaultValue={category?.sort_order ?? 100} />
            </Field>
            <Field label="Icon" htmlFor="icon">
              <div className="flex items-center gap-2">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-coral-50 text-coral-600">
                  <CategoryIcon name={icon} className="h-5 w-5" />
                </span>
                <Select id="icon" name="icon" value={icon} onChange={(e) => setIcon(e.target.value)}>
                  {CATEGORY_ICON_NAMES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={pending}>
              {category ? "Save category" : "Create category"}
            </Button>
          </div>
        </Panel>
        <Panel title="Category image">
          {category?.image_url && (
            <div className="relative mb-3 aspect-video overflow-hidden rounded-xl bg-surface">
              <Image src={category.image_url} alt="" fill sizes="320px" className="object-cover" />
            </div>
          )}
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label="Category image" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-navy-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
          <p className="mt-2 text-xs text-muted">Optional. Max 5 MB. Without an image, the icon is used.</p>
          {category?.image_url && <Checkbox name="remove_image" label="Remove current image" className="mt-3" />}
        </Panel>
      </div>
    </form>
  );
}
