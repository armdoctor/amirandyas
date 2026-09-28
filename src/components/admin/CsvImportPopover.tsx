"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { importGuestsCsv, type ImportResult } from "@/app/actions/import-csv";
import { CSV_SAMPLE } from "@/lib/csv";

export function CsvImportPopover() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function onImport() {
    if (!file) return;
    setResult(null);
    startTransition(async () => {
      const r = await importGuestsCsv(await file.text());
      setResult(r);
      if (r.ok) setFile(null);
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
      >
        Import CSV
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-[min(380px,calc(100vw-2rem))] rounded-lg border border-neutral-200 bg-white p-4 shadow-lg">
          <p className="text-sm font-medium text-neutral-900">Import guest CSV</p>
          <p className="mt-0.5 text-xs text-neutral-500">Merge-only — existing guests are kept, duplicates skipped.</p>
          <div className="mt-3 space-y-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-neutral-700 file:mr-2 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-2 file:py-1 file:text-xs"
            />
            <button
              type="button"
              onClick={onImport}
              disabled={!file || pending}
              className="w-full rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-300"
            >
              {pending ? "Importing…" : "Import"}
            </button>
            {result?.ok && (
              <p className="rounded-md border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs text-green-800">
                Imported {result.created}
                {result.skipped > 0 ? `, skipped ${result.skipped}` : ""}.
              </p>
            )}
            {result?.ok === false && (
              <div className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-800">
                <p className="font-medium">Import failed</p>
                <ul className="ml-4 mt-1 list-disc">
                  {result.errors.slice(0, 6).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {result.errors.length > 6 && <li>…and {result.errors.length - 6} more.</li>}
                </ul>
              </div>
            )}
            <details className="text-[11px] text-neutral-500">
              <summary className="cursor-pointer hover:text-neutral-700">CSV format</summary>
              <pre className="mt-1 overflow-x-auto rounded border border-neutral-200 bg-neutral-50 p-2 text-[10px] text-neutral-700">{CSV_SAMPLE}</pre>
              <p className="mt-1">
                Event columns: nikah, yasminFamily, yasminFriends, amirFriends, amirFamily (yes/no). Leave primaryFullName blank for the
                person who RSVPs.
              </p>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
