"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { deleteProductImage, updateProductImages, uploadProductImages } from "@/lib/actions/admin/products";
import { toast } from "@/lib/client/toast-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import type { ActionResult, ProductImage } from "@/types";
import { FormMessage, Panel } from "./ui";

export function ImageManager({ productId, images }: { productId: string; images: ProductImage[] }) {
  const router = useRouter();
  const upload = uploadProductImages.bind(null, productId);
  const [state, formAction, uploading] = useActionState<ActionResult | null, FormData>(upload, null);
  const [items, setItems] = useState(images.map((i) => ({ id: i.id, url: i.url, alt: i.alt })));
  const [syncedFrom, setSyncedFrom] = useState(images);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  // Re-sync local list after the server returns new images.
  if (images !== syncedFrom) {
    setSyncedFrom(images);
    setItems(images.map((i) => ({ id: i.id, url: i.url, alt: i.alt })));
  }

  useEffect(() => {
    if (state?.ok && fileRef.current) fileRef.current.value = "";
  }, [state]);

  const dirty = JSON.stringify(items.map((i) => [i.id, i.alt])) !== JSON.stringify(images.map((i) => [i.id, i.alt]));
  const move = (i: number, d: number) =>
    setItems((xs) => {
      const next = [...xs];
      const j = i + d;
      if (j < 0 || j >= next.length) return xs;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <Panel title={`Images (${items.length}/12)`}>
      {items.length === 0 && <p className="mb-4 text-sm text-muted">No images yet. The first image is used as the main product image.</p>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((img, i) => (
          <li key={img.id} className="overflow-hidden rounded-xl border border-line">
            <div className="relative aspect-square bg-surface">
              <Image src={img.url} alt={img.alt} fill sizes="240px" className="object-cover" />
              {i === 0 && <span className="absolute left-2 top-2 rounded-md bg-navy-900 px-2 py-0.5 text-[11px] font-bold text-white">Main</span>}
            </div>
            <div className="space-y-2 p-2.5">
              <Input aria-label="Alt text" placeholder="Alt text" value={img.alt} onChange={(e) => setItems((xs) => xs.map((x) => (x.id === img.id ? { ...x, alt: e.target.value } : x)))} className="h-9 text-sm" />
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move later">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-auto h-8 w-8 text-red-600 hover:bg-red-50"
                  aria-label="Delete image"
                  onClick={() => {
                    if (!confirm("Delete this image?")) return;
                    start(async () => {
                      const res = await deleteProductImage(img.id);
                      if (!res.ok) toast({ title: res.error, tone: "error" });
                      router.refresh();
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {dirty && (
        <Button
          className="mt-4"
          variant="secondary"
          loading={pending}
          onClick={() =>
            start(async () => {
              const res = await updateProductImages(productId, items.map(({ id, alt }) => ({ id, alt })));
              toast(res.ok ? { title: "Image order & alt text saved" } : { title: res.error, tone: "error" });
              router.refresh();
            })
          }
        >
          Save order &amp; alt text
        </Button>
      )}
      <form action={formAction} className="mt-5 space-y-3 rounded-xl border border-dashed border-line bg-surface/60 p-4">
        <label htmlFor="images" className="flex items-center gap-2 text-sm font-semibold">
          <ImagePlus className="h-4.5 w-4.5 text-coral-500" /> Upload images
        </label>
        <input ref={fileRef} id="images" name="images" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-navy-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
        <p className="text-xs text-muted">JPG, PNG, WebP or AVIF · max 5 MB each · square images (1:1) look best. Only upload images you own or have rights to use.</p>
        <Button type="submit" size="sm" loading={uploading}>
          Upload
        </Button>
        <FormMessage state={state} />
      </form>
    </Panel>
  );
}
