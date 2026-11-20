import type { Metadata } from "next";
import { ProductListing, parseListingParams } from "@/components/products/listing";
import { Breadcrumbs, PageHeader } from "@/components/ui/misc";
import { getCategories } from "@/lib/data/catalog";
import { firstParam } from "@/lib/utils";

export async function generateMetadata({ searchParams }: PageProps<"/shop">): Promise<Metadata> {
  const q = firstParam((await searchParams).q);
  return {
    title: q ? `Search: ${q.slice(0, 60)}` : "Shop All Scooty Accessories",
    description: "Shop all ScootyKit accessories for electric scooty, scooter and motorcycle riders in Pakistan. Prices in PKR, Cash on Delivery available.",
    alternates: { canonical: "/shop" },
    robots: q ? { index: false, follow: true } : undefined,
  };
}

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const params = parseListingParams(await searchParams);
  const categories = await getCategories();
  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader title={params.q ? "Search results" : "Shop all accessories"} description="Helmets, safety gear, security, comfort and tech for your ride.">
        <Breadcrumbs items={[{ label: "Shop" }]} />
      </PageHeader>
      <ProductListing params={params} allCategories={categories} basePath="/shop" />
    </div>
  );
}
