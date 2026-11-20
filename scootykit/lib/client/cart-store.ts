"use client";
import { createPersistedStore } from "./persisted-store";
import { clampQuantity } from "@/lib/commerce/pricing";

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  image: string | null;
  stock: number;
  quantity: number;
}

export const MAX_PER_LINE = 50;
const EMPTY: CartLine[] = [];

function validate(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return EMPTY;
  return raw
    .filter(
      (l): l is CartLine =>
        l && typeof l.productId === "string" && typeof l.name === "string" && typeof l.quantity === "number" && l.quantity > 0,
    )
    .slice(0, 50);
}

export const cartStore = createPersistedStore<CartLine[]>("scootykit:cart:v1", EMPTY, validate);

export function addToCart(item: Omit<CartLine, "quantity">, quantity = 1): { added: number; capped: boolean } {
  let added = 0;
  let capped = false;
  cartStore.set((lines) => {
    const existing = lines.find((l) => l.productId === item.productId);
    const current = existing?.quantity ?? 0;
    const target = clampQuantity(current + quantity, item.stock, MAX_PER_LINE);
    added = Math.max(target - current, 0);
    capped = target < current + quantity;
    if (target <= 0) return lines;
    if (existing) return lines.map((l) => (l.productId === item.productId ? { ...l, ...item, quantity: target } : l));
    return [...lines, { ...item, quantity: target }];
  });
  return { added, capped };
}

export function setQuantity(productId: string, quantity: number) {
  cartStore.set((lines) =>
    lines
      .map((l) => (l.productId === productId ? { ...l, quantity: clampQuantity(quantity, l.stock, MAX_PER_LINE) } : l))
      .filter((l) => l.quantity > 0),
  );
}

export function removeFromCart(productId: string) {
  cartStore.set((lines) => lines.filter((l) => l.productId !== productId));
}

export function clearCart() {
  cartStore.set([]);
}

/** Replace cached price/stock/name with fresh server data; drop unavailable products. */
export function refreshCartLines(fresh: Omit<CartLine, "quantity">[]) {
  const map = new Map(fresh.map((f) => [f.productId, f]));
  cartStore.set((lines) =>
    lines
      .filter((l) => map.has(l.productId))
      .map((l) => {
        const f = map.get(l.productId)!;
        return { ...l, ...f, quantity: clampQuantity(l.quantity, f.stock, MAX_PER_LINE) };
      })
      .filter((l) => l.quantity > 0),
  );
}

export function useCart() {
  return cartStore.useStore();
}

export function useCartCount() {
  return cartStore.useStore().reduce((n, l) => n + l.quantity, 0);
}
