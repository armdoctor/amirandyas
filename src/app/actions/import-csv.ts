"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { parseGuestCsv } from "@/lib/csv";
import { createInvite, createMember, findGuestByName } from "@/lib/store";

export type ImportResult = { ok: true; created: number; skipped: number } | { ok: false; errors: string[] };

// Merge-only by design: existing guests are never overwritten or removed.
export async function importGuestsCsv(text: string): Promise<ImportResult> {
  if (!(await isAdmin())) return { ok: false, errors: ["Not authorized."] };
  const parsed = parseGuestCsv(text);
  if (!parsed.ok) return parsed;

  let created = 0;
  let skipped = 0;
  const primaryIds = new Map<string, string>();

  for (const r of parsed.rows.filter((r) => !r.primaryFullName)) {
    const existing = await findGuestByName(r.fullName);
    if (existing) {
      primaryIds.set(r.fullName.toLowerCase(), existing.id);
      skipped++;
      continue;
    }
    const p = await createInvite(
      { firstName: r.firstName, lastName: r.lastName, invitedTo: r.invitedTo, plusOneAllowed: r.plusOneAllowed },
      [],
    );
    primaryIds.set(r.fullName.toLowerCase(), p.id);
    created++;
  }

  for (const r of parsed.rows.filter((r) => r.primaryFullName)) {
    const pid = primaryIds.get(r.primaryFullName.toLowerCase());
    if (!pid || (await findGuestByName(r.fullName))) {
      skipped++;
      continue;
    }
    await createMember(pid, { firstName: r.firstName, lastName: r.lastName, invitedTo: r.invitedTo, plusOneAllowed: false });
    created++;
  }

  revalidatePath("/admin");
  return { ok: true, created, skipped };
}
