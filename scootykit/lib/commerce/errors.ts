/** Maps exception messages raised by public.create_order() to customer-friendly text. */
export function orderErrorMessage(raw: string | undefined | null): string {
  const msg = raw ?? "";
  if (msg.startsWith("OUT_OF_STOCK:")) {
    return `Sorry, "${msg.slice("OUT_OF_STOCK:".length)}" doesn't have enough stock for that quantity. Please update your cart.`;
  }
  if (msg.startsWith("PRODUCT_UNAVAILABLE")) {
    return "One of the products in your cart is no longer available. Please review your cart.";
  }
  const map: Record<string, string> = {
    EMPTY_CART: "Your cart is empty.",
    TOO_MANY_ITEMS: "Your cart has too many different items for a single order.",
    INVALID_QUANTITY: "Please check the quantities in your cart.",
    INVALID_PHONE: "Please enter a valid Pakistani mobile number.",
    PAYMENT_METHOD_DISABLED: "That payment method isn't available right now. Please choose another.",
    DELIVERY_NOT_CONFIGURED: "Delivery to this location isn't configured yet. Please contact us to place your order.",
    COUPON_INVALID: "That coupon code isn't valid.",
    COUPON_NOT_STARTED: "That coupon isn't active yet.",
    COUPON_EXPIRED: "That coupon has expired.",
    COUPON_USAGE_LIMIT: "That coupon has reached its usage limit.",
    COUPON_MIN_ORDER: "Your order doesn't meet the minimum amount for this coupon.",
    COUPON_CUSTOMER_LIMIT: "You've already used this coupon.",
    INVALID_REQUEST: "Something went wrong. Please refresh the page and try again.",
  };
  return map[msg] ?? "We couldn't place your order. Please try again in a moment.";
}

export function couponErrorMessage(code: string, minAmount?: number): string {
  if (code === "MIN_ORDER" && minAmount) {
    return `This coupon needs a minimum subtotal of Rs. ${Math.round(minAmount).toLocaleString("en-PK")}.`;
  }
  return orderErrorMessage(`COUPON_${code}`);
}
