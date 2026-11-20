import Link from "next/link";
import type { StoreSettings } from "@/types";

export function AnnouncementBar({ settings }: { settings: StoreSettings }) {
  if (!settings.announcement_active || !settings.announcement_text) return null;
  const text = <span className="font-medium">{settings.announcement_text}</span>;
  return (
    <div className="bg-navy-900 text-white">
      <div className="container-page flex min-h-9 items-center justify-center py-2 text-center text-[13px]">
        {settings.announcement_link ? (
          <Link href={settings.announcement_link} className="underline-offset-4 hover:underline">
            {text} <span aria-hidden="true" className="text-coral-500">→</span>
          </Link>
        ) : (
          text
        )}
      </div>
    </div>
  );
}
