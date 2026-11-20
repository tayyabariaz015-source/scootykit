/**
 * Pure pricing helpers used for DISPLAY only. The database function
 * public.create_order() is the single source of truth for charged amounts.
 */

export interface PricedLine {
  price: number;
  sale_price: number | null;
  quantity: number;
}

export function effectivePrice(p: { price: number; sale_price: number | null }): number {
  return p.sale_price !== null && p.sale_price < p.price ? p.sale_price : p.price;
}

export function isOnSale(p: { price: number; sale_price: number | null }): boolean {
  return p.sale_price !== null && p.sale_price < p.price;
}

export function discountPercent(p: { price: number; sale_price: number | null }): number {
  if (!isOnSale(p) || p.price <= 0) return 0;
  return Math.round(((p.price - (p.sale_price as number)) / p.price) * 100);
}

export function cartSubtotal(lines: PricedLine[]): number {
  return lines.reduce((sum, l) => sum + effectivePrice(l) * l.quantity, 0);
}

export function orderTotal(subtotal: number, delivery: number, discount: number): number {
  return Math.max(subtotal - discount + delivery, 0);
}

/** Clamp a requested quantity to [1, min(stock, maxPerLine)]. */
export function clampQuantity(requested: number, stock: number, maxPerLine = 50): number {
  const max = Math.min(stock, maxPerLine);
  if (max <= 0) return 0;
  if (!Number.isFinite(requested)) return 1;
  return Math.max(1, Math.min(Math.floor(requested), max));
}
