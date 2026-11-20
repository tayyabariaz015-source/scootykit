"use client";
import { useActionState } from "react";
import { Mail } from "lucide-react";
import { subscribeNewsletter } from "@/lib/actions/engagement";
import { Button } from "@/components/ui/button";

export function Newsletter() {
  const [state, action, pending] = useActionState(subscribeNewsletter, null);
  return (
    <section className="container-page py-16" aria-labelledby="newsletter-title">
      <div className="relative overflow-hidden rounded-3xl bg-navy-900 px-6 py-12 text-center sm:px-12">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-coral-500/25 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-xl">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-coral-500">
            <Mail className="h-5 w-5" />
          </span>
          <h2 id="newsletter-title" className="text-2xl font-extrabold text-white sm:text-3xl">
            Get new arrivals first
          </h2>
          <p className="mt-2 text-[15px] text-slate-300">New accessories, restocks and genuine offers — no spam, unsubscribe anytime.</p>
          {state?.ok ? (
            <p role="status" className="mt-6 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-200">
              {state.message}
            </p>
          ) : (
            <form action={action} className="mt-6 flex flex-col gap-2 sm:flex-row" noValidate>
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={state && !state.ok ? true : undefined}
                aria-describedby={state && !state.ok ? "newsletter-error" : undefined}
                className="h-12 flex-1 rounded-xl border border-white/15 bg-white/10 px-4 text-[15px] text-white placeholder:text-slate-400 focus:border-coral-500 focus:outline-none focus:ring-4 focus:ring-coral-500/20"
              />
              <Button type="submit" size="lg" loading={pending} className="h-12">
                Subscribe
              </Button>
            </form>
          )}
          {state && !state.ok && (
            <p id="newsletter-error" role="alert" className="mt-3 text-sm text-coral-200">
              {state.error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
