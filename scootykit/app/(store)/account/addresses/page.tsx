import type { Metadata } from "next";
import { AddressBook } from "@/components/account/address-book";
import { getAddresses } from "@/lib/data/account";

export const metadata: Metadata = { title: "Saved Addresses", robots: { index: false } };

export default async function AddressesPage() {
  const addresses = await getAddresses();
  return (
    <div>
      <h1 className="mb-6 text-3xl font-extrabold">Saved addresses</h1>
      <AddressBook addresses={addresses} />
    </div>
  );
}
