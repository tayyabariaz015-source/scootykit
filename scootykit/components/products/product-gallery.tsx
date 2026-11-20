"use client";
import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types";
import { ProductImageFallback } from "./product-card";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const current = images[index];

  if (images.length === 0) {
    return (
      <div className="aspect-square overflow-hidden rounded-3xl border border-line">
        <ProductImageFallback label="Image coming soon" />
      </div>
    );
  }

  const go = (d: number) => setIndex((i) => (i + d + images.length) % images.length);

  return (
    <div>
      <div
        className="group relative aspect-square overflow-hidden rounded-3xl border border-line bg-surface"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        {failed[current.id] ? (
          <ProductImageFallback label="Image unavailable" />
        ) : (
          <Image
            key={current.id}
            src={current.url}
            alt={current.alt || `${name} — image ${index + 1}`}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="animate-fade-up object-cover"
            onError={() => setFailed((f) => ({ ...f, [current.id]: true }))}
          />
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-navy-900/80 px-2.5 py-1 text-xs font-semibold text-white">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img.id}
              role="tab"
              aria-selected={i === index}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border-2 bg-surface transition-colors",
                i === index ? "border-coral-500" : "border-transparent hover:border-line",
              )}
            >
              {failed[img.id] ? <ProductImageFallback /> : <Image src={img.url} alt="" fill sizes="96px" className="object-cover" onError={() => setFailed((f) => ({ ...f, [img.id]: true }))} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
