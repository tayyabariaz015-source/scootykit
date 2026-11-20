import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AccountSync } from "@/components/layout/account-sync";
import { Toaster } from "@/components/ui/toaster";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

const inter = localFont({
  src: "./fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const jakarta = localFont({
  src: "./fonts/PlusJakartaSans-Variable.woff2",
  variable: "--font-jakarta",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ScootyKit — Everything Your Scooty Needs.",
    template: "%s | ScootyKit",
  },
  description:
    "Shop quality electric scooty, scooter and motorcycle accessories in Pakistan — helmets, gloves, covers, locks, mobile holders and more. Cash on Delivery available.",
  applicationName: "ScootyKit",
  keywords: ["scooty accessories", "electric scooty", "scooter accessories Pakistan", "helmets", "disc lock", "mobile holder"],
  openGraph: {
    type: "website",
    siteName: "ScootyKit",
    locale: "en_PK",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-PK" className={`${inter.variable} ${jakarta.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
        <AccountSync />
        <Toaster />
      </body>
    </html>
  );
}
