import Link from "next/link";
import { LogoMark } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-[70vh] flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <Link href="/" aria-label="ScootyKit home" className="inline-block">
          <LogoMark className="mx-auto h-12 w-12" />
        </Link>
        <p className="mt-8 font-display text-7xl font-extrabold text-coral-500">404</p>
        <h1 className="mt-3 text-2xl font-extrabold">This page took a wrong turn</h1>
        <p className="mt-2 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">Back to home</ButtonLink>
          <ButtonLink href="/shop" variant="outline">
            Shop all
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
