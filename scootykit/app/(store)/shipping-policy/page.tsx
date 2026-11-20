import type { Metadata } from "next";
import { ContentPage } from "@/components/content/content-page";

export const metadata: Metadata = { title: "Shipping Policy", alternates: { canonical: "/shipping-policy" } };

export default function ShippingPolicyPage() {
  return (
    <ContentPage title="Shipping Policy" draft updated="[Date]">
      <h2>Where we deliver</h2>
      <p>ScootyKit delivers to addresses within Pakistan through [courier partner name(s)].</p>
      <h2>Delivery charges</h2>
      <p>Delivery charges depend on your city and province and are shown at checkout before you place your order. Any free-delivery offer is shown at checkout when it applies.</p>
      <h2>Processing &amp; delivery time</h2>
      <ul>
        <li>Orders are processed within [X] working days after confirmation.</li>
        <li>Estimated delivery time is [X–Y] working days for major cities and [X–Y] working days for other areas.</li>
        <li>Bank transfer orders are processed after the payment is verified.</li>
      </ul>
      <h2>Order confirmation</h2>
      <p>We may call or message you on the number you provide to confirm your order before dispatch. [Describe your confirmation process.]</p>
      <h2>Tracking</h2>
      <p>You can check your order status at any time on the Track Order page using your order number and phone number. [If you share courier tracking numbers, explain how here.]</p>
      <h2>Failed deliveries</h2>
      <p>[Explain what happens if the customer is unavailable or refuses a Cash on Delivery parcel.]</p>
      <h2>Contact</h2>
      <p>For shipping questions, contact us at [email] or [phone].</p>
    </ContentPage>
  );
}
