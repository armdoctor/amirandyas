import Papa from "papaparse";
import { z } from "zod";
import { EVENT_KEYS, EVENTS, type EventKey } from "@/lib/events";

// CSV columns: firstName, lastName, primaryFullName (blank for the primary),
// one yes/no column per event key, and plusOneAllowed.
export const CSV_EVENT_COLUMNS = EVENT_KEYS;

export const CSV_SAMPLE = [
  ["firstName", "lastName", "primaryFullName", ...EVENT_KEYS, "plusOneAllowed"].join(","),
  "Robert,Smith,,yes,yes,no,no,yes,no",
  "Jane,Smith,Robert Smith,yes,yes,no,no,yes,no",
  "Tina,Lee,,no,no,yes,no,no,yes",
].join("\n");

export type ParsedRow = {
  firstName: string;
  lastName: string;
  fullName: string;
  primaryFullName: string;
  invitedTo: EventKey[];
  plusOneAllowed: boolean;
};

export type ParseResult = { ok: true; rows: ParsedRow[] } | { ok: false; errors: string[] };

const RowSchema = z.object({
  firstName: z.string().trim().min(1, "firstName required"),
  lastName: z.string().trim().min(1, "lastName required"),
  primaryFullName: z.string().trim().default(""),
  plusOneAllowed: z.string().optional(),
});

function toBool(v: string | undefined): boolean {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "x";
}

export function parseGuestCsv(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  if (parsed.errors.length) {
    return { ok: false, errors: parsed.errors.map((e) => `Row ${e.row ?? "?"}: ${e.message}`) };
  }

  const errors: string[] = [];
  const rows: ParsedRow[] = [];
  for (const [i, raw] of parsed.data.entries()) {
    const r = RowSchema.safeParse(raw);
    if (!r.success) {
      errors.push(`Row ${i + 2}: ${r.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")}`);
      continue;
    }
    rows.push({
      firstName: r.data.firstName,
      lastName: r.data.lastName,
      fullName: `${r.data.firstName} ${r.data.lastName}`.replace(/\s+/g, " ").trim(),
      primaryFullName: r.data.primaryFullName,
      invitedTo: EVENT_KEYS.filter((k) => toBool(raw[k])),
      plusOneAllowed: toBool(r.data.plusOneAllowed),
    });
  }

  const primaries = new Set(rows.filter((r) => !r.primaryFullName).map((r) => r.fullName.toLowerCase()));
  for (const r of rows) {
    if (r.primaryFullName && !primaries.has(r.primaryFullName.toLowerCase())) {
      errors.push(`${r.fullName}: primaryFullName "${r.primaryFullName}" not found among primaries in this file.`);
    }
    if (!r.primaryFullName && r.invitedTo.length === 0) {
      errors.push(`${r.fullName}: primary must be invited to at least one event (${EVENT_KEYS.map((k) => EVENTS[k].shortName).join(", ")}).`);
    }
  }
  const seen = new Set<string>();
  for (const r of rows) {
    const k = r.fullName.toLowerCase();
    if (seen.has(k)) errors.push(`Duplicate name: ${r.fullName}`);
    seen.add(k);
  }

  return errors.length ? { ok: false, errors } : { ok: true, rows };
}

export function rowsToCsv(rows: Record<string, string | number | boolean | null>[]): string {
  return Papa.unparse(rows);
}
