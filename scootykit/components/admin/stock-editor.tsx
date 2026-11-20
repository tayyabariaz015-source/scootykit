"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateStock } from "@/lib/actions/admin/products";
import { toast } from "@/lib/client/toast-store";
import { Button } from "@/components/ui/button";

export function StockEditor({ productId, stock }: { productId: string; stock: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(stock));
  const [pending, start] = useTransition();
  const changed = value !== String(stock);
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(value);
        if (!Number.isInteger(n) || n < 0) return toast({ title: "Stock must be a whole number ≥ 0", tone: "error" });
        start(async () => {
          const res = await updateStock(productId, n);
          toast(res.ok ? { title: res.message ?? "Saved" } : { title: res.error, tone: "error" });
          router.refresh();
        });
      }}
    >
      <label className="sr-only" htmlFor={`stock-${productId}`}>
        Stock
      </label>
      <input
        id={`stock-${productId}`}
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
        className="h-9 w-20 rounded-lg border border-line px-2.5 text-sm focus:border-coral-500 focus:outline-none"
      />
      <Button type="submit" size="sm" variant={changed ? "primary" : "outline"} disabled={!changed} loading={pending}>
        Save
      </Button>
    </form>
  );
}
