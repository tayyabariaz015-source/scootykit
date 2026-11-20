import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing, parseListingParams } from "@/components/products/listing";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Breadcrumbs } from "@/components/ui/misc";
import { getCategories, getCategoryBySlug } from "@/lib/data/catalog";
import { SITE_URL } from "@/lib/env";

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  const title = category.seo_title || `${category.name} in Pakistan`;
  const description = category.seo_description || category.description || `Shop ${category.name} at ScootyKit.`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: { title, description, url: `/category/${category.slug}`, images: category.image_url ? [category.image_url] : undefined },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const [category, categories] = await Promise.all([getCategoryBySlug(slug), getCategories()]);
  if (!category) notFound();
  const listingParams = parseListingParams(await searchParams);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Categories", item: `${SITE_URL}/categories` },
      { "@type": "ListItem", position: 3, name: category.name, item: `${SITE_URL}/category/${category.slug}` },
    ],
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Breadcrumbs items={[{ label: "Categories", href: "/categories" }, { label: category.name }]} />
      <div className="mb-8 mt-5 flex items-start gap-4 rounded-3xl bg-surface p-5 sm:items-center sm:p-7">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-coral-600 shadow-[var(--shadow-card)] sm:h-16 sm:w-16">
          <CategoryIcon name={category.icon} className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold sm:text-4xl">{category.name}</h1>
          {category.description && <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{category.description}</p>}
          <p className="mt-2 text-sm font-medium text-navy-700">
            {category.product_count ?? 0} {(category.product_count ?? 0) === 1 ? "product" : "products"}
          </p>
        </div>
      </div>
      <ProductListing params={listingParams} allCategories={categories} fixedCategory={category} basePath={`/category/${category.slug}`} />
    </div>
  );
}
