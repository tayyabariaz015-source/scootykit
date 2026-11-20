import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageHeader } from "@/components/ui/misc";
import { getStoreSettings } from "@/lib/data/settings";
import { formatPKR } from "@/lib/commerce/format";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers about ordering, payment, delivery, tracking and returns at ScootyKit.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const s = await getStoreSettings();
  const payments = [s.cod_enabled && "Cash on Delivery", s.bank_transfer_enabled && "Bank Transfer"].filter(Boolean).join(" and ") || "the methods shown at checkout";
  const faqs: { q: string; a: React.ReactNode; text: string }[] = [
    {
      q: "Do I need an account to order?",
      text: "No. You can check out as a guest. An account lets you see order history, save addresses and keep your wishlist and cart across devices.",
      a: (
        <>
          No — you can check out as a guest. An <Link href="/register">account</Link> lets you see order history, save addresses and keep your wishlist and cart across devices.
        </>
      ),
    },
    {
      q: "Which payment methods do you accept?",
      text: `We currently accept ${payments}. Online card and wallet payments are not available yet.`,
      a: <>We currently accept {payments}. Online card and wallet payments are not available yet.</>,
    },
    {
      q: "How does bank transfer work?",
      text: "After you place the order, the confirmation page shows our account details. Transfer the total with your order number as the reference. We process the order after verifying the payment.",
      a: <>After you place the order, the confirmation page shows our account details. Transfer the total with your order number as the reference. We process the order once the payment is verified.</>,
    },
    {
      q: "How much is delivery?",
      text: "Delivery charges depend on your city and are shown at checkout before you place the order.",
      a: (
        <>
          Delivery charges depend on your city and are shown at checkout before you place the order.
          {s.free_delivery_threshold !== null && <> Orders of {formatPKR(s.free_delivery_threshold)} or more get free delivery.</>} See our{" "}
          <Link href="/shipping-policy">shipping policy</Link>.
        </>
      ),
    },
    {
      q: "How can I track my order?",
      text: "Use the Track Order page with your order number and the mobile number you used at checkout.",
      a: (
        <>
          Use the <Link href="/track-order">Track Order</Link> page with your order number and the mobile number you used at checkout.
        </>
      ),
    },
    {
      q: "Can I return or exchange an item?",
      text: "Please read our Return & Exchange Policy for eligibility and the process.",
      a: (
        <>
          Please read our <Link href="/returns">Return &amp; Exchange Policy</Link> for eligibility and the process.
        </>
      ),
    },
    {
      q: "Are the reviews real?",
      text: "Yes. Only customers whose order containing the product was delivered can leave a review, and each review is checked before it appears.",
      a: <>Yes. Only customers whose order containing the product was delivered can leave a review, and each review is checked before it appears.</>,
    },
    {
      q: "Is stock shown on the website accurate?",
      text: "Stock comes directly from our inventory and is checked again when you place your order, so you can't order more than we have.",
      a: <>Stock comes directly from our inventory and is checked again when you place your order, so you can&apos;t order more than we have.</>,
    },
  ];
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.text } })),
  };
  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <PageHeader title="Frequently asked questions" description="Quick answers about ordering from ScootyKit.">
        <Breadcrumbs items={[{ label: "FAQ" }]} />
      </PageHeader>
      <div className="divide-y divide-line rounded-2xl border border-line">
        {faqs.map((f) => (
          <details key={f.q} className="group px-5 py-4 [&_a]:font-semibold [&_a]:text-coral-600 [&_a]:underline">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="text-xl leading-none text-coral-500 transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="mt-3 text-[15px] leading-7 text-navy-700">{f.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted">
        Still have a question? <Link href="/contact" className="font-semibold text-coral-600 hover:underline">Contact us</Link>.
      </p>
    </div>
  );
}
