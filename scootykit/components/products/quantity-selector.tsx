"use client";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantitySelector({
  value,
  max,
  onChange,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
  label?: string;
}) {
  const h = size === "sm" ? "h-9" : "h-12";
  const w = size === "sm" ? "w-9" : "w-11";
  return (
    <div className={cn("inline-flex items-center rounded-xl border border-line bg-white", h)} role="group" aria-label={label}>
      <button type="button" className={cn("grid h-full place-items-center rounded-l-xl text-navy-900 hover:bg-surface disabled:opacity-40", w)} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(Math.max(Math.floor(n), 1), Math.max(max, 1)));
        }}
        className="h-full w-12 border-x border-line text-center text-[15px] font-semibold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button type="button" className={cn("grid h-full place-items-center rounded-r-xl text-navy-900 hover:bg-surface disabled:opacity-40", w)} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
