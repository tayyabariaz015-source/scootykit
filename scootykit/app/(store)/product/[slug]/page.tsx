import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, PackageCheck, RotateCcw, Truck, Wallet } from "lucide-react";
import { Stars } from "@/components/home/sections";
import { ProductGrid } from "@/components/products/product-card";
import { ProductGallery } from "@/components/products/product-gallery";
import { PurchasePanel } from "@/components/products/purchase-panel";
import { ReviewForm } from "@/components/products/review-form";
import { Breadcrumbs, SectionHeading } from "@/components/ui/misc";
import { Price } from "@/components/ui/price";
import { getProductBySlug, getProductReviews, getRelatedProducts } from "@/lib/data/catalog";
import { getActiveDeliveryZones, getStoreSettings } from "@/lib/data/settings";
import { formatPKR } from "@/lib/commerce/format";
import { effectivePrice } from "@/lib/commerce/pricing";
import { SITE_URL } from "@/lib/env";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

// Product pages are generated on first visit, then cached and revalidated (ISR).
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const title = product.seo_title || product.name;
  const description =
    product.seo_description || product.short_description || product.description.slice(0, 160) || `Buy ${product.name} online at ScootyKit Pakistan.`;
  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/product/${product.slug}`,
      images: product.images.slice(0, 1).map((i) => ({ url: i.url, alt: i.alt || product.name })),
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, { reviews, stats }, settings, zones] = await Promise.all([
    getRelatedProducts(product, 4),
    getProductReviews(product.id),
    getStoreSettings(),
    getActiveDeliveryZones(),
  ]);

  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= product.low_stock_threshold;
  const minDelivery = zones.length ? Math.min(...zones.map((z) => z.charge)) : null;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description || product.description.slice(0, 500),
    sku: product.sku ?? undefined,
    image: product.images.map((i) => i.url),
    category: product.category?.name,
    brand: { "@type": "Brand", name: "ScootyKit" },
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: effectivePrice(product).toFixed(0),
      availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: `${SITE_URL}/product/${product.slug}`,
    },
    ...(stats && stats.review_count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: stats.average_rating, reviewCount: stats.review_count } }
      : {}),
  };

  return (
    <div className="container-page py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <Breadcrumbs
        items={[
          { label: "Shop", href: "/shop" },
          ...(product.category ? [{ label: product.category.name, href: `/category/${product.category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          {product.category && (
            <Link href={`/category/${product.category.slug}`} className="text-xs font-bold uppercase tracking-[0.14em] text-coral-600 hover:underline">
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-2 text-[1.75rem] font-extrabold leading-tight sm:text-4xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            {stats && stats.review_count > 0 && (
              <a href="#reviews" className="flex items-center gap-2 hover:text-navy-900">
                <Stars rating={stats.average_rating} />
                {stats.average_rating} ({stats.review_count} {stats.review_count === 1 ? "review" : "reviews"})
              </a>
            )}
            {product.sku && <span>SKU: {product.sku}</span>}
          </div>

          <Price price={product.price} salePrice={product.sale_price} size="lg" showBadge className="mt-5" />

          <p className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${soldOut ? "text-red-600" : lowStock ? "text-amber-700" : "text-emerald-700"}`}>
            <span className={`h-2 w-2 rounded-full ${soldOut ? "bg-red-500" : lowStock ? "bg-amber-500" : "bg-emerald-500"}`} />
            {soldOut ? "Out of stock" : lowStock ? `Low stock — only ${product.stock} left` : "In stock"}
          </p>

          {product.short_description && <p className="mt-5 text-[15px] leading-7 text-navy-700">{product.short_description}</p>}

          {product.features.length > 0 && (
            <ul className="mt-5 space-y-2">
              {product.features.slice(0, 6).map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[15px] text-navy-800">
                  <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-coral-500" />
                  {f}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-7">
            <PurchasePanel product={product} />
          </div>

          <div className="mt-7 divide-y divide-line rounded-2xl border border-line">
            <InfoRow icon={Truck} title="Delivery">
              {settings.delivery_estimate_text ?? "Delivery across Pakistan."}{" "}
              {minDelivery !== null && (minDelivery > 0 ? `Delivery from ${formatPKR(minDelivery)}, calculated at checkout.` : "Delivery charge shown at checkout.")}
              {settings.free_delivery_threshold !== null && ` Free delivery on orders of ${formatPKR(settings.free_delivery_threshold)} or more.`}
            </InfoRow>
            {settings.cod_enabled && (
              <InfoRow icon={Wallet} title="Cash on Delivery">
                Pay in cash when your order arrives.
              </InfoRow>
            )}
            <InfoRow icon={RotateCcw} title="Returns & exchanges">
              See our{" "}
              <Link href="/returns" className="font-semibold text-coral-600 hover:underline">
                return &amp; exchange policy
              </Link>
              .
            </InfoRow>
            <InfoRow icon={PackageCheck} title="Track your order">
              Use your order number and phone on the{" "}
              <Link href="/track-order" className="font-semibold text-coral-600 hover:underline">
                tracking page
              </Link>
              .
            </InfoRow>
          </div>
        </div>
      </div>

      {/* Description & specifications */}
      <div className="mt-14 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="text-xl font-bold">Description</h2>
          {product.description ? (
            <div className="prose-sk mt-4 whitespace-pre-line">{product.description}</div>
          ) : (
            <p className="mt-4 text-muted">No description yet.</p>
          )}
          {product.features.length > 6 && (
            <>
              <h3 className="mt-8 text-lg font-bold">All features</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {product.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[15px] text-navy-800">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        {product.specifications.length > 0 && (
          <section>
            <h2 className="text-xl font-bold">Specifications</h2>
            <dl className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {product.specifications.map((s) => (
                <div key={s.id ?? s.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-4 py-3 text-sm odd:bg-surface/70">
                  <dt className="font-medium text-muted">{s.label}</dt>
                  <dd className="font-semibold text-navy-900">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      {/* Reviews */}
      <section id="reviews" className="mt-14 scroll-mt-32 border-t border-line pt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Customer reviews</h2>
            {stats && stats.review_count > 0 ? (
              <p className="mt-1.5 flex items-center gap-2 text-sm text-muted">
                <Stars rating={stats.average_rating} /> {stats.average_rating} out of 5 · {stats.review_count} verified{" "}
                {stats.review_count === 1 ? "review" : "reviews"}
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-muted">No reviews yet. Reviews come only from customers who received this product.</p>
            )}
          </div>
          <ReviewForm productId={product.id} productSlug={product.slug} />
        </div>
        {reviews.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <article key={r.id} className="rounded-2xl border border-line p-5">
                <div className="flex items-center justify-between gap-3">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-muted">{formatDate(r.created_at)}</span>
                </div>
                {r.title && <h3 className="mt-3 font-semibold">{r.title}</h3>}
                <p className="mt-1.5 text-[15px] leading-7 text-navy-700">{r.body}</p>
                <p className="mt-3 text-sm font-semibold">
                  {r.author_name} <span className="font-normal text-emerald-700">· Verified buyer</span>
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <SectionHeading eyebrow="You may also like" title="Related products" />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, title, children }: { icon: typeof Truck; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3.5 p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-coral-500" />
      <div className="text-sm">
        <p className="font-semibold text-navy-900">{title}</p>
        <p className="mt-0.5 leading-6 text-muted">{children}</p>
      </div>
    </div>
  );
}
