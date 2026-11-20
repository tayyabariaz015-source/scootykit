"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfile } from "@/lib/actions/account";
import { profileSchema, type ProfileValues } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/misc";

export function ProfileForm({ defaults, email }: { defaults: ProfileValues; email: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: defaults });
  const { errors, isSubmitting, isDirty } = form.formState;
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        const res = await updateProfile(values);
        setMsg(res.ok ? { ok: true, text: res.message ?? "Saved" } : { ok: false, text: res.error });
        if (res.ok) form.reset(values);
      })}
    >
      {msg && <Alert tone={msg.ok ? "success" : "danger"}>{msg.text}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="pf-name" error={errors.full_name?.message}>
          <Input id="pf-name" autoComplete="name" {...form.register("full_name")} />
        </Field>
        <Field label="Mobile number" htmlFor="pf-phone" error={errors.phone?.message}>
          <Input id="pf-phone" type="tel" autoComplete="tel" placeholder="03001234567" {...form.register("phone")} />
        </Field>
        <Field label="Email" htmlFor="pf-email" hint="Contact us to change your email." className="sm:col-span-2">
          <Input id="pf-email" value={email} disabled readOnly />
        </Field>
      </div>
      <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
        Save changes
      </Button>
    </form>
  );
}
