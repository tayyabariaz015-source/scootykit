import type { Metadata } from "next";
import { CheckoutForm, type CheckoutDefaults } from "@/components/checkout/checkout-form";
import { Breadcrumbs, PageHeader } from "@/components/ui/misc";
import { getAddresses, getProfile } from "@/lib/data/account";
import { getStoreSettings } from "@/lib/data/settings";

// Depends on the signed-in user — never prerender.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [settings, profile, addresses] = await Promise.all([getStoreSettings(), getProfile(), getAddresses()]);
  const defaults: CheckoutDefaults = {
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    email: profile?.email ?? "",
    addresses,
  };
  const bankReady = settings.bank_transfer_enabled && Boolean(settings.bank_account_number || settings.bank_iban);
  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader title="Checkout" description={profile ? undefined : "No account needed — checkout as a guest in under a minute."}>
        <Breadcrumbs items={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
      </PageHeader>
      <CheckoutForm defaults={defaults} payment={{ cod: settings.cod_enabled, bankTransfer: bankReady }} />
    </div>
  );
}
