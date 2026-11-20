import type { Metadata } from "next";
import { BadgeCheck, HeartHandshake, ShieldCheck, Zap } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "About ScootyKit",
  description: "ScootyKit is a Pakistani online store for electric scooty, scooter and motorcycle accessories — Everything Your Scooty Needs.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  { icon: ShieldCheck, title: "Safety first", text: "Helmets, guards, locks and lights that make everyday riding safer." },
  { icon: Zap, title: "Made for e-mobility", text: "A range built around electric scooty owners and their daily commute." },
  { icon: BadgeCheck, title: "Honest listings", text: "Real prices in PKR, live stock, and reviews only from verified buyers." },
  { icon: HeartHandshake, title: "Rider-friendly service", text: "Simple checkout, Cash on Delivery and order tracking you can rely on." },
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-navy-900 py-16 text-white sm:py-20">
        <div className="container-page max-w-3xl">
          <Breadcrumbs items={[{ label: "About" }]} className="[&_a]:text-slate-300 [&_span]:text-white" />
          <h1 className="mt-5 text-4xl font-extrabold text-white sm:text-5xl">
            Everything your <span className="text-coral-500">scooty</span> needs.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-300">
            ScootyKit is an online store for electric scooty, scooter and motorcycle riders in Pakistan. Finding the right accessories shouldn&apos;t mean visiting a dozen
            shops — so we bring safety gear, security, comfort and tech for your ride together in one place.
          </p>
        </div>
      </section>
      <section className="container-page max-w-5xl py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-line p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-coral-50 text-coral-600">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg font-bold">{title}</h2>
              <p className="mt-1.5 text-[15px] leading-7 text-muted">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-3xl bg-surface p-8 text-center">
          <h2 className="text-2xl font-extrabold">Ready to kit out your ride?</h2>
          <p className="mt-2 text-muted">Browse 27 categories of scooty accessories.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/shop">Shop now</ButtonLink>
            <ButtonLink href="/contact" variant="outline">
              Contact us
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
