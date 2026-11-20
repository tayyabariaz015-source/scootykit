"use client";
import { useActionState } from "react";
import { saveDeliveryZone } from "@/lib/actions/admin/store";
import { PROVINCES } from "@/lib/commerce/pakistan";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select } from "@/components/ui/field";
import type { ActionResult, DeliveryZone } from "@/types";
import { FormMessage } from "./ui";

export function DeliveryZoneForm({ zone }: { zone: DeliveryZone | null }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(saveDeliveryZone.bind(null, zone?.id ?? null), null);
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k]?.[0] : undefined);
  return (
    <form action={formAction} className="space-y-2" noValidate>
      <div className="grid gap-2 sm:grid-cols-[1.3fr_1fr_1fr_110px_auto_auto] sm:items-center">
        <Input name="name" aria-label="Zone name" placeholder="Zone name" defaultValue={zone?.name ?? ""} aria-invalid={!!err("name")} />
        <Select name="province" aria-label="Province" defaultValue={zone?.province ?? ""} aria-invalid={!!err("province")}>
          <option value="">All provinces</option>
          {PROVINCES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </Select>
        <Input name="city" aria-label="City" placeholder="All cities" defaultValue={zone?.city ?? ""} />
        <Input name="charge" aria-label="Charge in rupees" inputMode="decimal" placeholder="Rs." defaultValue={zone?.charge ?? ""} aria-invalid={!!err("charge")} />
        <Checkbox name="is_active" defaultChecked={zone?.is_active ?? true} label="Active" />
        <Button type="submit" size="sm" variant={zone ? "outline" : "primary"} loading={pending}>
          {zone ? "Save" : "Add zone"}
        </Button>
      </div>
      <FormMessage state={state && !state.ok ? state : null} />
    </form>
  );
}
