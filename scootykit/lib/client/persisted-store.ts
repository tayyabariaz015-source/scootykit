"use client";
import { useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed external store (cross-tab synced) used by the cart
 * and guest wishlist. Works with useSyncExternalStore so SSR renders the empty
 * server snapshot and the client hydrates without mismatches.
 */
export function createPersistedStore<T>(key: string, initial: T, validate: (raw: unknown) => T) {
  let state: T = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = validate(JSON.parse(raw));
    } catch {
      state = initial;
    }
    window.addEventListener("storage", (e) => {
      if (e.key !== key) return;
      try {
        state = e.newValue ? validate(JSON.parse(e.newValue)) : initial;
      } catch {
        state = initial;
      }
      listeners.forEach((l) => l());
    });
  }

  function get(): T {
    load();
    return state;
  }

  function set(next: T | ((prev: T) => T)) {
    load();
    state = typeof next === "function" ? (next as (prev: T) => T)(state) : next;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Storage full / private mode — keep in memory.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    load();
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function useStore(): T {
    return useSyncExternalStore(subscribe, get, () => initial);
  }

  /** True after hydration — useful to avoid flashing empty states. */
  function useHydrated(): boolean {
    return useSyncExternalStore(
      subscribe,
      () => true,
      () => false,
    );
  }

  return { get, set, subscribe, useStore, useHydrated };
}
