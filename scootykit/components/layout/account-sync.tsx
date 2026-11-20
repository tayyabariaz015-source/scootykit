"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCartProducts, loadServerCart, saveServerCart } from "@/lib/actions/cart";
import { syncWishlist } from "@/lib/actions/wishlist";
import { cartStore, type CartLine } from "@/lib/client/cart-store";
import { wishlistStore } from "@/lib/client/wishlist-store";
import { setSignedIn } from "@/lib/client/session";
import { clampQuantity } from "@/lib/commerce/pricing";

/**
 * Keeps the guest (localStorage) cart & wishlist in sync with the signed-in
 * user's server-side cart & wishlist. Renders nothing.
 */
export function AccountSync() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    const supabase = createClient();
    let active = false;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let suppressSave = false;

    async function mergeOnSignIn() {
      const serverLines = await loadServerCart();
      if (serverLines === null) return;
      const local = cartStore.get();
      const qty = new Map<string, number>();
      for (const l of [...serverLines, ...local.map((l) => ({ productId: l.productId, quantity: l.quantity }))]) {
        qty.set(l.productId, Math.max(qty.get(l.productId) ?? 0, l.quantity));
      }
      const products = await getCartProducts([...qty.keys()]);
      const merged: CartLine[] = products
        .map((p) => ({
          productId: p.id,
          slug: p.slug,
          name: p.name,
          price: p.price,
          salePrice: p.sale_price,
          image: p.image?.url ?? null,
          stock: p.stock,
          quantity: clampQuantity(qty.get(p.id) ?? 1, p.stock),
        }))
        .filter((l) => l.quantity > 0);
      suppressSave = true;
      cartStore.set(merged);
      suppressSave = false;
      await saveServerCart(merged.map((l) => ({ productId: l.productId, quantity: l.quantity })));

      const ids = await syncWishlist(wishlistStore.get());
      if (ids) wishlistStore.set(ids);
    }

    const unsubscribeCart = cartStore.subscribe(() => {
      if (!active || suppressSave) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveServerCart(cartStore.get().map((l) => ({ productId: l.productId, quantity: l.quantity }))).catch(() => undefined);
      }, 800);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
        if (!active) {
          active = true;
          setSignedIn(true);
          // Defer: Supabase recommends not awaiting other calls inside this callback.
          setTimeout(() => mergeOnSignIn().catch(() => undefined), 0);
        }
      } else if (event === "SIGNED_OUT") {
        active = false;
        setSignedIn(false);
        cartStore.set([]);
        wishlistStore.set([]);
      }
    });

    return () => {
      clearTimeout(saveTimer);
      unsubscribeCart();
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}
