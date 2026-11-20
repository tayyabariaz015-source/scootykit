"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "@/lib/client/toast-store";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/types";

/** Small button that runs a server action with optional confirmation and toast feedback. */
export function ActionButton({
  action,
  label,
  confirmText,
  variant = "outline",
  size = "sm",
  className,
}: {
  action: () => Promise<ActionResult<unknown>>;
  label: string;
  confirmText?: string;
  variant?: "outline" | "ghost" | "danger" | "primary" | "secondary";
  size?: "sm" | "md";
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant={variant}
      size={size}
      loading={pending}
      className={className}
      onClick={() => {
        if (confirmText && !confirm(confirmText)) return;
        start(async () => {
          const res = await action();
          if (res.ok) {
            if (res.message) toast({ title: res.message });
            router.refresh();
          } else toast({ title: res.error, tone: "error" });
        });
      }}
    >
      {label}
    </Button>
  );
}
