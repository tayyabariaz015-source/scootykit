import type { Metadata } from "next";
import { CategoryGrid } from "@/components/home/sections";
import { Breadcrumbs, EmptyState, PageHeader } from "@/components/ui/misc";
import { getCategories } from "@/lib/data/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "All Categories",
  description: "Browse all ScootyKit categories — helmets, gloves, covers, locks, GPS trackers, lights and more for scooty riders in Pakistan.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader title="All categories" description="Everything for your scooty, organised so you can find it fast.">
        <Breadcrumbs items={[{ label: "Categories" }]} />
      </PageHeader>
      {categories.length > 0 ? (
        <CategoryGrid categories={categories} />
      ) : (
        <EmptyState title="Categories unavailable" description="We couldn't load categories right now. Please try again shortly." />
      )}
    </div>
  );
}
