"use client";
import { createPersistedStore } from "./persisted-store";

export const couponStore = createPersistedStore<string>("scootykit:coupon:v1", "", (raw) =>
  typeof raw === "string" ? raw.toUpperCase().slice(0, 32) : "",
);
