import type { Metadata } from "next";
import { WishlistView } from "@/components/products/wishlist-view";
import { Breadcrumbs, PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function WishlistPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader title="Your wishlist" description="Products you've saved for later.">
        <Breadcrumbs items={[{ label: "Wishlist" }]} />
      </PageHeader>
      <WishlistView />
    </div>
  );
}
