import type { Metadata } from "next";
import { ContentPage } from "@/components/content/content-page";

export const metadata: Metadata = { title: "Terms & Conditions", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <ContentPage title="Terms & Conditions" draft updated="[Date]">
      <p>These terms apply to purchases made on the ScootyKit website operated by [Legal business name], [address].</p>
      <h2>Orders</h2>
      <ul>
        <li>An order is an offer to buy. It is accepted when we confirm and dispatch it.</li>
        <li>Prices and stock are confirmed when you place your order. If an item becomes unavailable, we will contact you.</li>
        <li>We may cancel orders that cannot be verified or appear fraudulent.</li>
      </ul>
      <h2>Prices &amp; payment</h2>
      <ul>
        <li>All prices are in Pakistani Rupees (PKR) and include [applicable taxes, if any].</li>
        <li>Delivery charges are shown at checkout before you place the order.</li>
        <li>Bank transfer orders are processed only after payment is verified. Cash on Delivery orders are paid to the courier on delivery.</li>
      </ul>
      <h2>Coupons</h2>
      <p>Coupons are subject to their stated conditions (minimum order, expiry, usage limits) and cannot be exchanged for cash.</p>
      <h2>Product information</h2>
      <p>We describe products as accurately as possible. Colours and appearance may vary slightly from photos. Check compatibility with your scooty model before ordering. [Add any safety disclaimers.]</p>
      <h2>Returns</h2>
      <p>Returns and exchanges are handled under our Return &amp; Exchange Policy.</p>
      <h2>Liability</h2>
      <p>[Describe limitation of liability in line with applicable Pakistani law. Have this reviewed by a professional.]</p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of Pakistan. [Jurisdiction / city.]</p>
      <h2>Contact</h2>
      <p>[Email], [phone].</p>
    </ContentPage>
  );
}
