"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteAddress, saveAddress } from "@/lib/actions/account";
import { MAJOR_CITIES, PROVINCES } from "@/lib/commerce/pakistan";
import { formatPhone } from "@/lib/commerce/phone";
import { addressSchema, type AddressValues } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert, Badge, EmptyState } from "@/components/ui/misc";
import type { Address } from "@/types";

const EMPTY: AddressValues = { label: "Home", full_name: "", phone: "", province: "" as AddressValues["province"], city: "", address_line: "", is_default: false };

function AddressForm({ address, onDone }: { address: Address | null; onDone: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: address ? { ...address, province: address.province as AddressValues["province"] } : EMPTY,
  });
  const { errors, isSubmitting } = form.formState;
  return (
    <form
      noValidate
      className="space-y-4 rounded-2xl border border-line p-5"
      onSubmit={form.handleSubmit(async (values) => {
        const res = await saveAddress(address?.id ?? null, values);
        if (!res.ok) return setError(res.error);
        router.refresh();
        onDone();
      })}
    >
      <h2 className="text-lg font-bold">{address ? "Edit address" : "New address"}</h2>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Label" htmlFor="a-label" error={errors.label?.message}>
          <Input id="a-label" placeholder="Home, Office…" {...form.register("label")} />
        </Field>
        <Field label="Recipient name" htmlFor="a-name" error={errors.full_name?.message}>
          <Input id="a-name" autoComplete="name" {...form.register("full_name")} />
        </Field>
        <Field label="Mobile number" htmlFor="a-phone" error={errors.phone?.message}>
          <Input id="a-phone" type="tel" autoComplete="tel" placeholder="03001234567" {...form.register("phone")} />
        </Field>
        <Field label="Province" htmlFor="a-prov" error={errors.province?.message}>
          <Select id="a-prov" {...form.register("province")}>
            <option value="">Select province</option>
            {PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </Field>
        <Field label="City" htmlFor="a-city" error={errors.city?.message}>
          <Input id="a-city" list="a-cities" {...form.register("city")} />
          <datalist id="a-cities">
            {MAJOR_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Complete address" htmlFor="a-line" error={errors.address_line?.message} className="sm:col-span-2">
          <Textarea id="a-line" rows={2} {...form.register("address_line")} />
        </Field>
      </div>
      <Checkbox label="Set as default address" {...form.register("is_default")} />
      <div className="flex gap-2">
        <Button type="submit" loading={isSubmitting}>
          Save address
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-5">
      {editing ? (
        <AddressForm address={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
      ) : (
        <Button onClick={() => setEditing("new")} variant="outline" disabled={addresses.length >= 10}>
          <Plus className="h-4 w-4" /> Add address
        </Button>
      )}
      {addresses.length === 0 && !editing ? (
        <EmptyState icon={MapPin} title="No saved addresses" description="Save an address to check out faster next time." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-2xl border border-line p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{a.label}</p>
                {a.is_default && <Badge tone="coral">Default</Badge>}
              </div>
              <p className="mt-2 text-sm">{a.full_name}</p>
              <p className="text-sm text-muted">{formatPhone(a.phone)}</p>
              <p className="mt-1 text-sm text-muted">
                {a.address_line}, {a.city}, {a.province}
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50"
                  loading={pending}
                  onClick={() => {
                    if (!confirm("Delete this address?")) return;
                    start(async () => {
                      await deleteAddress(a.id);
                      router.refresh();
                    });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
