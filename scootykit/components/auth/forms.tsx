"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type FieldValues, type Path, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { login, register as registerAction, requestPasswordReset, updatePassword } from "@/lib/actions/auth";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type RegisterValues,
  type ResetPasswordValues,
} from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/misc";
import type { ActionResult } from "@/types";

function applyServerErrors<T extends FieldValues>(form: UseFormReturn<T>, res: ActionResult<unknown>) {
  if (!res.ok && res.fieldErrors) {
    for (const [k, v] of Object.entries(res.fieldErrors)) if (v?.[0]) form.setError(k as Path<T>, { message: v[0] });
  }
}

function PasswordInput({ id, autoComplete, invalid, ...rest }: React.ComponentProps<"input"> & { invalid?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={show ? "text" : "password"} autoComplete={autoComplete} aria-invalid={invalid || undefined} className="pr-11" {...rest} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-navy-900" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { errors, isSubmitting } = form.formState;
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        const res = await login(values, next);
        if (!res.ok) {
          setError(res.error);
          applyServerErrors(form, res);
          return;
        }
        router.replace(res.data!.redirectTo);
        router.refresh();
      })}
    >
      {notice && <Alert tone="warning">{notice}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-semibold text-coral-600 hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", phone: "", password: "", confirm_password: "" },
  });
  const { errors, isSubmitting } = form.formState;
  if (done) return <Alert tone="success" title="Check your email">{done}</Alert>;
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        const res = await registerAction(values);
        if (!res.ok) {
          setError(res.error);
          applyServerErrors(form, res);
          return;
        }
        if (res.data?.redirectTo) {
          router.replace(res.data.redirectTo);
          router.refresh();
        } else setDone(res.message ?? "Check your email to continue.");
      })}
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message} required>
        <Input id="full_name" autoComplete="name" aria-invalid={!!errors.full_name} {...form.register("full_name")} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email?.message} required>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Field label="Mobile number (optional)" htmlFor="phone" error={errors.phone?.message} hint="Speeds up checkout">
        <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="03001234567" aria-invalid={!!errors.phone} {...form.register("phone")} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters with a letter and a number" required>
        <PasswordInput id="password" autoComplete="new-password" invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <Field label="Confirm password" htmlFor="confirm_password" error={errors.confirm_password?.message} required>
        <PasswordInput id="confirm_password" autoComplete="new-password" invalid={!!errors.confirm_password} {...form.register("confirm_password")} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Create account
      </Button>
      <p className="text-center text-xs text-muted">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });
  const { errors, isSubmitting } = form.formState;
  if (message) return <Alert tone="success">{message}</Alert>;
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        const res = await requestPasswordReset(values);
        if (res.ok) setMessage(res.message ?? "Check your inbox.");
        else setError(res.error);
      })}
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirm_password: "" } });
  const { errors, isSubmitting } = form.formState;
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        const res = await updatePassword(values);
        if (!res.ok) {
          setError(res.error);
          applyServerErrors(form, res);
          return;
        }
        router.replace(res.data!.redirectTo);
        router.refresh();
      })}
    >
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="New password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters with a letter and a number">
        <PasswordInput id="password" autoComplete="new-password" invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm_password" error={errors.confirm_password?.message}>
        <PasswordInput id="confirm_password" autoComplete="new-password" invalid={!!errors.confirm_password} {...form.register("confirm_password")} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Update password
      </Button>
    </form>
  );
}
