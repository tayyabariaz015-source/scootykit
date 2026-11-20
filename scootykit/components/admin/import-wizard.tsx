"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import Papa from "papaparse";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, XCircle } from "lucide-react";
import { commitImport, previewImport } from "@/lib/actions/admin/import";
import { IMPORT_COLUMNS, type ParsedImportRow } from "@/lib/commerce/import";
import { formatPKR } from "@/lib/commerce/format";
import { Button } from "@/components/ui/button";
import { Alert, Badge } from "@/components/ui/misc";
import { Panel } from "./ui";

async function readFile(file: File): Promise<Record<string, unknown>[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || file.type === "text/csv") {
    const text = await file.text();
    const res = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: "greedy" });
    if (res.errors.length && res.data.length === 0) throw new Error(res.errors[0].message);
    return res.data;
  }
  if (name.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/browser");
    const rows = (await readSheet(file)) as unknown[][];
    const [header, ...body] = rows;
    if (!header) return [];
    const keys = header.map((h) => String(h ?? "").trim());
    return body
      .filter((r) => r.some((c) => c !== null && String(c).trim() !== ""))
      .map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i] === null || r[i] === undefined ? "" : String(r[i])])));
  }
  throw new Error("Please upload a .csv or .xlsx file.");
}

const TEMPLATE = `${IMPORT_COLUMNS.join(",")}\n"Example Half Face Helmet","Scooty Helmets",SK-HEL-001,https://supplier.example/item,"https://supplier.example/img1.jpg | https://supplier.example/img2.jpg","Lightweight ABS shell with visor","Material: ABS; Size: Free size; Weight: 900 g",1800,3499,10\n`;

export function ImportWizard() {
  const [records, setRecords] = useState<Record<string, unknown>[] | null>(null);
  const [rows, setRows] = useState<ParsedImportRow[] | null>(null);
  const [unknown, setUnknown] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ created: number; skipped: number } | null>(null);
  const [fileName, setFileName] = useState("");
  const [pending, start] = useTransition();

  const valid = rows?.filter((r) => r.errors.length === 0).length ?? 0;
  const invalid = (rows?.length ?? 0) - valid;

  return (
    <div className="space-y-6">
      <Alert tone="info" title="Supplier research ≠ sellable inventory">
        Every imported row becomes a <strong>Draft</strong> product. Before publishing, enter a verified selling price, real stock, and upload images you own or have
        permission to use. Supplier image links are stored privately for reference and are never shown in the store.
      </Alert>

      <Panel title="1. Upload your file">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-surface/60 p-4 hover:border-coral-300">
            <FileSpreadsheet className="h-6 w-6 text-coral-500" />
            <span className="text-sm">
              <span className="font-semibold">{fileName || "Choose a CSV or Excel (.xlsx) file"}</span>
              <span className="block text-xs text-muted">Up to 1,000 rows. First row must be column headers.</span>
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setFileName(file.name);
                setError(null);
                setDone(null);
                setRows(null);
                try {
                  if (file.size > 5 * 1024 * 1024) throw new Error("File is larger than 5 MB.");
                  const recs = await readFile(file);
                  setRecords(recs);
                  start(async () => {
                    const res = await previewImport(recs);
                    if (res.ok) {
                      setRows(res.data!.rows);
                      setUnknown(res.data!.unknownHeaders);
                    } else setError(res.error);
                  });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Couldn't read that file.");
                }
              }}
            />
          </label>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`}
            download="scootykit-import-template.csv"
            className="text-sm font-semibold text-coral-600 hover:underline"
          >
            Download CSV template
          </a>
        </div>
        <p className="mt-3 text-xs text-muted">
          Columns: {IMPORT_COLUMNS.join(", ")}. Common names like “Product Name”, “Price”, “Qty” are recognised. Specifications: <code>Label: Value; Label: Value</code>. Images:
          URLs separated by spaces, commas or <code>|</code>.
        </p>
        {error && <Alert tone="danger" className="mt-4">{error}</Alert>}
        {pending && <p className="mt-4 text-sm text-muted">Validating rows…</p>}
      </Panel>

      {done && (
        <Alert tone="success" title="Import complete">
          {done.created} draft product{done.created === 1 ? "" : "s"} created{done.skipped ? `, ${done.skipped} row(s) skipped` : ""}.{" "}
          <Link href="/admin/products?status=draft" className="font-semibold underline">
            Review drafts →
          </Link>
        </Alert>
      )}

      {rows && !done && (
        <Panel
          title="2. Preview"
          actions={
            <div className="flex items-center gap-2 text-sm">
              <Badge tone="success">{valid} ready</Badge>
              {invalid > 0 && <Badge tone="danger">{invalid} with errors</Badge>}
            </div>
          }
          bodyClassName="p-0"
        >
          {unknown.length > 0 && <p className="border-b border-line px-5 py-3 text-xs text-amber-800">Ignored columns: {unknown.join(", ")}</p>}
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-2.5">Row</th>
                  <th className="px-4 py-2.5">Product</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Cost → Sell</th>
                  <th className="px-4 py-2.5">Stock</th>
                  <th className="px-4 py-2.5">Checks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.rowNumber} className={r.errors.length ? "bg-red-50/50" : ""}>
                    <td className="px-4 py-2.5 text-muted">{r.rowNumber}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{r.name || <em className="text-muted">missing</em>}</p>
                      <p className="text-xs text-muted">{r.sku ?? "No SKU"}</p>
                    </td>
                    <td className="px-4 py-2.5">{r.categoryId ? r.categoryInput : <span className="text-amber-700">{r.categoryInput || "—"}</span>}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {r.costPrice !== null ? formatPKR(r.costPrice) : "—"} → {r.sellingPrice !== null ? formatPKR(r.sellingPrice) : "—"}
                    </td>
                    <td className="px-4 py-2.5">{r.stock ?? 0}</td>
                    <td className="px-4 py-2.5">
                      {r.errors.length === 0 && r.warnings.length === 0 && <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" aria-label="OK" />}
                      <ul className="space-y-0.5 text-xs">
                        {r.errors.map((e) => (
                          <li key={e} className="flex items-start gap-1 text-red-700">
                            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {e}
                          </li>
                        ))}
                        {r.warnings.map((w) => (
                          <li key={w} className="flex items-start gap-1 text-amber-800">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {w}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-line p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">Rows with errors are skipped. Valid rows are imported as drafts.</p>
            <Button
              disabled={valid === 0}
              loading={pending}
              onClick={() =>
                start(async () => {
                  if (!records) return;
                  const res = await commitImport(records);
                  if (res.ok) setDone(res.data!);
                  else setError(res.error);
                })
              }
            >
              Import {valid} as drafts
            </Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
