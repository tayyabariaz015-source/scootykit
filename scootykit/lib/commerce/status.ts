import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

export const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
export const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "awaiting_verification", "paid", "refunded", "failed"];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  awaiting_verification: "Awaiting verification",
  paid: "Paid",
  refunded: "Refunded",
  failed: "Failed",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  bank_transfer: "Bank Transfer",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  unpaid: "neutral",
  awaiting_verification: "warning",
  paid: "success",
  refunded: "info",
  failed: "danger",
};

/** Customer-facing progress steps (cancelled shown separately). */
export const PROGRESS_STEPS: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];
