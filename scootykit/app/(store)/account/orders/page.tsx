import type { Metadata } from "next";
import { OrderList } from "@/components/account/order-list";
import { getMyOrders } from "@/lib/data/account";

export const metadata: Metadata = { title: "Order History", robots: { index: false } };

export default async function OrdersPage() {
  const orders = await getMyOrders();
  return (
    <div>
      <h1 className="mb-6 text-3xl font-extrabold">Order history</h1>
      <OrderList orders={orders} />
    </div>
  );
}
