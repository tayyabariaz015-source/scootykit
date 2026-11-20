import type { Metadata } from "next";
import { ContentPage } from "@/components/content/content-page";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <ContentPage title="Privacy Policy" draft updated="[Date]">
      <p>This policy explains how [Legal business name] (“ScootyKit”, “we”) collects and uses personal information when you use this website.</p>
      <h2>Information we collect</h2>
      <ul>
        <li>Order details: name, mobile number, optional email, delivery address, order notes and items purchased.</li>
        <li>Account details (if you register): name, email, optional phone, saved addresses, wishlist and cart.</li>
        <li>Messages you send through the contact form and newsletter sign-ups.</li>
        <li>Basic technical data needed to run the site securely (e.g. IP address for abuse prevention and rate limiting).</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To process, deliver and support your orders.</li>
        <li>To contact you about your order.</li>
        <li>To send newsletters only if you subscribed — you can unsubscribe at any time.</li>
        <li>To keep the store secure and prevent fraud.</li>
      </ul>
      <h2>Sharing</h2>
      <p>We share delivery details with our courier partner(s) [names] only to deliver your order. Our website is hosted on [Vercel] and data is stored with [Supabase]. We do not sell your personal information.</p>
      <h2>Cookies &amp; local storage</h2>
      <p>We use essential cookies to keep you signed in, and your browser&apos;s local storage to remember your cart and wishlist. [Add analytics/marketing tools here if you add any.]</p>
      <h2>Retention</h2>
      <p>We keep order records for [X years] for accounting and support purposes. [Adjust as needed.]</p>
      <h2>Your choices</h2>
      <p>You can update your profile and addresses in your account, or contact us at [email] to request access to or deletion of your data.</p>
      <h2>Contact</h2>
      <p>[Legal business name], [address], [email].</p>
    </ContentPage>
  );
}
