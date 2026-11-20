import type { Metadata } from "next";
import { ContentPage } from "@/components/content/content-page";

export const metadata: Metadata = { title: "Return & Exchange Policy", alternates: { canonical: "/returns" } };

export default function ReturnsPage() {
  return (
    <ContentPage title="Return & Exchange Policy" draft updated="[Date]">
      <h2>Eligibility</h2>
      <ul>
        <li>Return or exchange requests must be made within [X] days of delivery.</li>
        <li>Items must be unused, in original packaging, with all accessories and tags.</li>
        <li>[List any non-returnable items, e.g. helmets for hygiene reasons, if applicable.]</li>
      </ul>
      <h2>Damaged, defective or wrong items</h2>
      <p>If you receive a damaged, defective or incorrect item, contact us within [X] days with your order number and photos. [Describe whether you replace, refund, and who pays return shipping.]</p>
      <h2>How to request a return or exchange</h2>
      <ol className="mb-4 list-decimal space-y-1.5 pl-5">
        <li>Contact us at [email / WhatsApp] with your order number.</li>
        <li>[Describe pickup or drop-off process.]</li>
        <li>Once we receive and inspect the item, we will [process the exchange / issue a refund].</li>
      </ol>
      <h2>Refunds</h2>
      <p>Approved refunds are issued via [method, e.g. bank transfer] within [X] working days. Delivery charges are [refundable / non-refundable] unless the item was faulty or incorrect.</p>
      <h2>Contact</h2>
      <p>Questions? Contact us at [email] or [phone].</p>
    </ContentPage>
  );
}
