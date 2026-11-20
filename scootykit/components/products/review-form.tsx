"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { submitReview } from "@/lib/actions/reviews";
import { reviewSchema, type ReviewValues } from "@/lib/validation/schemas";
import { useSignedIn } from "@/lib/client/session";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId, productSlug }: { productId: string; productSlug: string }) {
  const signedIn = useSignedIn();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const form = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { product_id: productId, rating: 0, title: "", body: "" },
  });
  const { errors, isSubmitting } = form.formState;

  if (!signedIn) {
    return (
      <p className="text-sm text-muted">
        Bought this product?{" "}
        <Link href={`/login?next=/product/${productSlug}`} className="font-semibold text-coral-600 hover:underline">
          Sign in
        </Link>{" "}
        to write a review.
      </p>
    );
  }
  if (result?.ok) return <Alert tone="success">{result.text}</Alert>;
  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Write a review
      </Button>
    );
  }

  return (
    <form
      noValidate
      className="space-y-4 rounded-2xl border border-line p-5"
      onSubmit={form.handleSubmit(async (values) => {
        const res = await submitReview(values);
        setResult(res.ok ? { ok: true, text: res.message ?? "Thanks!" } : { ok: false, text: res.error });
      })}
    >
      {result && !result.ok && <Alert tone="danger">{result.text}</Alert>}
      <Controller
        control={form.control}
        name="rating"
        render={({ field }) => (
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Your rating</legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => field.onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={field.value === n} className="rounded p-0.5">
                  <Star className={cn("h-7 w-7", n <= field.value ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                </button>
              ))}
            </div>
            {errors.rating && <p className="mt-1 text-[13px] text-red-600">{errors.rating.message}</p>}
          </fieldset>
        )}
      />
      <Field label="Title (optional)" htmlFor="review-title" error={errors.title?.message}>
        <Input id="review-title" {...form.register("title")} />
      </Field>
      <Field label="Your review" htmlFor="review-body" error={errors.body?.message} required>
        <Textarea id="review-body" rows={4} aria-invalid={!!errors.body} {...form.register("body")} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" loading={isSubmitting}>
          Submit review
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
