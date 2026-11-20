"use client";
import { useSyncExternalStore } from "react";

/** Whether the browser has a signed-in Supabase session (set by <AccountSync/>). */
let signedIn = false;
const listeners = new Set<() => void>();

export function setSignedIn(value: boolean) {
  if (signedIn === value) return;
  signedIn = value;
  listeners.forEach((l) => l());
}

export function isSignedIn() {
  return signedIn;
}

export function useSignedIn() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => signedIn,
    () => false,
  );
}
