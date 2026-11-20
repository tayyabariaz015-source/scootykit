"use client";
import { createPersistedStore } from "./persisted-store";

const EMPTY: string[] = [];

export const wishlistStore = createPersistedStore<string[]>("scootykit:wishlist:v1", EMPTY, (raw) =>
  Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string").slice(0, 200) : EMPTY,
);

export function useWishlist() {
  return wishlistStore.useStore();
}
