import { PackageOpen } from "lucide-react";
import { Newsletter } from "@/components/home/newsletter";
import { PopularAccessoriesTabs, type AccessoryTab } from "@/components/home/popular-accessories";
import { CustomerReviews, FeaturedCategories, Hero, ProductRail, ShopByCategory, WhyChoose } from "@/components/home/sections";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, SectionHeading } from "@/components/ui/misc";
import {
  getBestSellers,
  getCategories,
  getFeaturedProducts,
  getLatestReviews,
  getNewArrivals,
  getProductsInCategory,
} from "@/lib/data/catalog";
import { getStoreSettings } from "@/lib/data/settings";
import { SITE_URL } from "@/lib/env";

export const revalidate = 120;

const POPULAR_SLUGS = ["scooty-helmets", "anti-theft-disc-locks", "scooty-mobile-holders", "scooty-covers", "riding-gloves", "gps-trackers"];

export default async function HomePage() {
  const [settings, categories, featured, bestSellers, newArrivals, reviews] = await Promise.all([
    getStoreSettings(),
    getCategories(),
    getFeaturedProducts(8),
    getBestSellers(8),
    getNewArrivals(8),
    getLatestReviews(6),
  ]);

  const popularCats = POPULAR_SLUGS.map((s) => categories.find((c) => c.slug === s)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c && (c.product_count ?? 0) > 0),
  );
  const tabs: AccessoryTab[] = (
    await Promise.all(
      popularCats.map(async (c) => ({ slug: c.slug, name: c.name, icon: c.icon, products: await getProductsInCategory(c.id, 4) })),
    )
  ).filter((t) => t.products.length > 0);

  const catalogEmpty = newArrivals.length === 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "ScootyKit",
    slogan: "Everything Your Scooty Needs.",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/scootykit-icon.svg`,
    areaServed: "PK",
    currenciesAccepted: "PKR",
    ...(settings.contact_email ? { email: settings.contact_email } : {}),
    ...(settings.contact_phone ? { telephone: settings.contact_phone } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero settings={settings} />
      <FeaturedCategories categories={categories} />
      <ShopByCategory categories={categories} />

      {catalogEmpty ? (
        <section className="container-page pt-16 sm:pt-20">
          <SectionHeading eyebrow="Products" title="Our first collection is on its way" />
          <EmptyState
            icon={PackageOpen}
            title="New accessories are being added"
            description="We're preparing our first range of verified scooty accessories. Subscribe below and we'll let you know as soon as they're live."
            action={
              <ButtonLink href="/categories" variant="outline">
                Browse categories
              </ButtonLink>
            }
          />
        </section>
      ) : (
        <>
          <ProductRail eyebrow="Handpicked" title="Featured products" products={featured} href="/shop" />
          <ProductRail eyebrow="Customer favourites" title="Best sellers" products={bestSellers} href="/shop?sort=popular" tone="surface" />
          <ProductRail eyebrow="Just landed" title="New arrivals" products={newArrivals} href="/shop?sort=newest" />
          {tabs.length > 0 && (
            <section className="container-page pt-16 sm:pt-20">
              <SectionHeading eyebrow="Essentials" title="Popular accessories" description="Everyday essentials riders reach for most — by category." />
              <PopularAccessoriesTabs tabs={tabs} />
            </section>
          )}
        </>
      )}

      <WhyChoose settings={settings} />
      <CustomerReviews reviews={reviews} />
      <Newsletter />
    </>
  );
}
