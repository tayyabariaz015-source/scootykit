"use client";
import { useSyncExternalStore } from "react";

export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone?: "success" | "error" | "info";
  action?: { label: string; href: string };
}

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const EMPTY: Toast[] = [];

function emit() {
  listeners.forEach((l) => l());
}

export function toast(t: Omit<Toast, "id">) {
  const id = nextId++;
  toasts = [...toasts.slice(-2), { ...t, id }];
  emit();
  setTimeout(() => dismissToast(id), 4500);
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => EMPTY,
  );
}
