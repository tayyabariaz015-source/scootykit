import { NextResponse } from "next/server";
import { getIsAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function csvCell(v: unknown) {
  const s = String(v ?? "");
  // Prevent CSV/formula injection in spreadsheet apps
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await getIsAdmin())) return new NextResponse("Forbidden", { status: 403 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("newsletter_subscribers").select("email,status,source,created_at").order("created_at", { ascending: false }).limit(50000);
  if (error) return new NextResponse("Export failed", { status: 500 });
  const lines = ["email,status,source,created_at", ...(data ?? []).map((r) => [r.email, r.status, r.source, r.created_at].map(csvCell).join(","))];
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="scootykit-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
