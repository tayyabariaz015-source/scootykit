import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/content/contact-form";
import { Breadcrumbs, PageHeader } from "@/components/ui/misc";
import { getStoreSettings } from "@/lib/data/settings";
import { formatPhone } from "@/lib/commerce/phone";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with ScootyKit about orders, products or delivery.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getStoreSettings();
  const items = [
    s.contact_phone && { icon: Phone, label: "Phone", value: formatPhone(s.contact_phone), href: `tel:${s.contact_phone}` },
    s.whatsapp_number && { icon: MessageCircle, label: "WhatsApp", value: s.whatsapp_number, href: `https://wa.me/${s.whatsapp_number.replace(/\D/g, "")}` },
    s.contact_email && { icon: Mail, label: "Email", value: s.contact_email, href: `mailto:${s.contact_email}` },
    s.business_hours && { icon: Clock, label: "Hours", value: s.business_hours },
    s.business_address && { icon: MapPin, label: "Address", value: s.business_address },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string }[];

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader title="Contact us" description="Questions about an order or a product? Send us a message and we'll get back to you.">
        <Breadcrumbs items={[{ label: "Contact" }]} />
      </PageHeader>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-line p-5 sm:p-7">
          <ContactForm />
        </div>
        <aside className="space-y-3">
          {items.length === 0 ? (
            <p className="rounded-2xl bg-surface p-5 text-sm text-muted">Contact details will appear here once they&apos;re added in the admin settings.</p>
          ) : (
            items.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex gap-3.5 rounded-2xl border border-line p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-coral-50 text-coral-600">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="text-sm">
                  <p className="font-semibold">{label}</p>
                  {href ? (
                    <a href={href} className="text-muted hover:text-coral-600" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {value}
                    </a>
                  ) : (
                    <p className="text-muted">{value}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}
