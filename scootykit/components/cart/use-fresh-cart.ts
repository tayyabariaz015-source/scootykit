"use client";
import { useEffect, useRef, useState } from "react";
import { getCartProducts } from "@/lib/actions/cart";
import { cartStore, refreshCartLines } from "@/lib/client/cart-store";

/**
 * On mount, replaces cached cart prices/stock with live server data and reports
 * what changed (price updates, removed products, quantity reductions).
 */
export function useFreshCart() {
  const [notices, setNotices] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(true);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const before = cartStore.get();
    if (before.length === 0) {
      Promise.resolve().then(() => setRefreshing(false));
      return;
    }
    getCartProducts(before.map((l) => l.productId))
      .then((products) => {
        const fresh = products.map((p) => ({
          productId: p.id,
          slug: p.slug,
          name: p.name,
          price: p.price,
          salePrice: p.sale_price,
          image: p.image?.url ?? null,
          stock: p.stock,
        }));
        const msgs: string[] = [];
        const map = new Map(fresh.map((f) => [f.productId, f]));
        for (const l of before) {
          const f = map.get(l.productId);
          if (!f) msgs.push(`"${l.name}" is no longer available and was removed.`);
          else if (f.stock <= 0) msgs.push(`"${l.name}" is now out of stock and was removed.`);
          else if (f.stock < l.quantity) msgs.push(`Only ${f.stock} of "${l.name}" available — quantity updated.`);
          else if ((f.salePrice ?? f.price) !== (l.salePrice ?? l.price)) msgs.push(`The price of "${l.name}" has been updated.`);
        }
        refreshCartLines(fresh);
        setNotices(msgs);
      })
      .catch(() => undefined)
      .finally(() => setRefreshing(false));
  }, []);

  return { notices, refreshing };
}
