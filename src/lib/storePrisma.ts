import "server-only";
import { EVENT_KEYS, type EventKey } from "@/lib/events";
import type { Attendance, Guest } from "@/lib/types";
import type { GuestModel as Row } from "@/generated/prisma/models";
import { getPrisma, withAudit, type Tx } from "@/lib/db";
import type { DeletedInvite, NewGuest, WriteCtx } from "@/lib/storeTypes";

// ---- Row <-> Guest mapping -------------------------------------------------

const cap = (k: EventKey) => k[0].toUpperCase() + k.slice(1);
const invitedCol = (k: EventKey) => `invitedTo${cap(k)}` as keyof Row;
const attendingCol = (k: EventKey) => `attending${cap(k)}` as keyof Row;

function toGuest(r: Row): Guest {
  const invitedTo = EVENT_KEYS.filter((k) => r[invitedCol(k)] === true);
  const attending: Attendance = {};
  for (const k of EVENT_KEYS) {
    const v = r[attendingCol(k)] as boolean | null;
    if (v !== null) attending[k] = v;
  }
  return {
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    fullName: r.fullName,
    isPrimaryContact: r.isPrimaryContact,
    primaryGuestId: r.primaryGuestId,
    invitedTo,
    plusOneAllowed: r.plusOneAllowed,
    hasResponded: r.hasResponded,
    attending,
    dietaryRestrictions: r.dietaryRestrictions,
    plusOneAttending: r.plusOneAttending,
    plusOneName: r.plusOneName,
    plusOneDietary: r.plusOneDietary,
    message: r.message,
    submittedAt: r.submittedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

/** Convert a partial Guest patch into column updates. */
function toData(patch: Partial<Omit<Guest, "id">>): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k === "invitedTo") {
      const set = new Set(v as EventKey[]);
      for (const e of EVENT_KEYS) d[invitedCol(e)] = set.has(e);
    } else if (k === "attending") {
      const a = v as Attendance;
      for (const e of EVENT_KEYS) d[attendingCol(e)] = a[e] ?? null;
    } else if (k === "submittedAt") {
      d.submittedAt = v ? new Date(v as string) : null;
    } else if (k === "createdAt") {
      // never written
    } else {
      d[k] = v;
    }
  }
  return d;
}

// ---- Reads -----------------------------------------------------------------

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function fullNameOf(first: string, last: string) {
  return `${first.trim()} ${last.trim()}`.replace(/\s+/g, " ").trim();
}

export async function listGuests(): Promise<Guest[]> {
  const rows = await getPrisma().guest.findMany({ orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
  return rows.map(toGuest);
}

export async function getGuest(id: string): Promise<Guest | null> {
  const r = await getPrisma().guest.findUnique({ where: { id } });
  return r ? toGuest(r) : null;
}

export async function findGuestByName(name: string): Promise<Guest | null> {
  const n = normalizeName(name);
  if (!n) return null;
  // Case/space-insensitive match. Fine for a few hundred guests.
  const rows = await getPrisma().guest.findMany();
  const hit = rows.find((r) => normalizeName(r.fullName) === n);
  return hit ? toGuest(hit) : null;
}

export async function findGuestsByFullNames(names: string[]): Promise<Guest[]> {
  const wanted = new Set(names.map(normalizeName));
  const rows = await getPrisma().guest.findMany();
  return rows.filter((r) => wanted.has(normalizeName(r.fullName))).map(toGuest);
}

export async function householdMembers(primaryId: string): Promise<Guest[]> {
  const rows = await getPrisma().guest.findMany({ where: { primaryGuestId: primaryId }, orderBy: { firstName: "asc" } });
  return rows.map(toGuest);
}

// ---- Writes (every write is tagged + audited) ------------------------------

function newRow(input: NewGuest, primaryId: string | null) {
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    fullName: fullNameOf(input.firstName, input.lastName),
    isPrimaryContact: primaryId === null,
    primaryGuestId: primaryId,
    plusOneAllowed: primaryId === null ? input.plusOneAllowed : false,
    ...toData({ invitedTo: input.invitedTo }),
  };
}

export async function createInvite(primary: NewGuest, members: NewGuest[], ctx: WriteCtx): Promise<Guest> {
  return withAudit(ctx, async (tx) => {
    const p = await tx.guest.create({
      data: newRow({ ...primary, plusOneAllowed: members.length ? false : primary.plusOneAllowed }, null) as never,
    });
    for (const m of members) await tx.guest.create({ data: newRow(m, p.id) as never });
    return toGuest(p);
  });
}

export async function createMember(primaryId: string, member: NewGuest, ctx: WriteCtx): Promise<Guest> {
  return withAudit(ctx, async (tx) => toGuest(await tx.guest.create({ data: newRow(member, primaryId) as never })));
}

export async function updateGuestRecord(
  id: string,
  patch: Partial<Omit<Guest, "id">>,
  ctx: WriteCtx,
): Promise<Guest | null> {
  return withAudit(ctx, async (tx) => {
    const exists = await tx.guest.findUnique({ where: { id } });
    if (!exists) return null;
    return toGuest(await tx.guest.update({ where: { id }, data: toData(patch) as never }));
  });
}

/** Several guest updates in ONE transaction — all or nothing (household RSVP). */
export async function updateMany(updates: { id: string; patch: Partial<Omit<Guest, "id">> }[], ctx: WriteCtx) {
  await withAudit(ctx, async (tx) => {
    for (const u of updates) await tx.guest.update({ where: { id: u.id }, data: toData(u.patch) as never });
  });
}

/**
 * Delete ONE invitation: a single guest, or a primary plus their household.
 * A full snapshot is written to AuditLog first, so it can be restored from the
 * dashboard. There is deliberately no "delete all".
 */
export async function deleteInvite(id: string, ctx: WriteCtx): Promise<boolean> {
  return withAudit(ctx, async (tx) => {
    const g = await tx.guest.findUnique({ where: { id } });
    if (!g) return false;
    const members = g.isPrimaryContact ? await tx.guest.findMany({ where: { primaryGuestId: id } }) : [];
    const rows = [g, ...members];
    await tx.auditLog.create({
      data: {
        action: "admin_delete",
        actor: ctx.actor,
        guestId: g.id,
        guestName: g.fullName,
        before: JSON.parse(JSON.stringify({ guests: rows })),
      },
    });
    if (members.length) await tx.guest.deleteMany({ where: { primaryGuestId: id } });
    await tx.guest.delete({ where: { id } });
    return true;
  });
}

export async function listDeletedInvites(limit = 30): Promise<DeletedInvite[]> {
  const prisma = getPrisma();
  const [deletes, restores] = await Promise.all([
    prisma.auditLog.findMany({ where: { action: "admin_delete" }, orderBy: { createdAt: "desc" }, take: limit }),
    prisma.auditLog.findMany({ where: { action: "admin_restore" }, select: { refLogId: true } }),
  ]);
  const restored = new Set(restores.map((r) => r.refLogId));
  return deletes
    .filter((d) => !restored.has(d.id))
    .map((d) => {
      const guests = ((d.before as { guests?: Row[] } | null)?.guests ?? []) as Row[];
      return {
        logId: d.id,
        deletedAt: d.createdAt.toISOString(),
        primaryName: d.guestName ?? "",
        people: guests.map((x) => x.fullName),
        hadResponded: guests.some((x) => x.hasResponded),
      };
    });
}

/** Put a deleted invitation back exactly as it was (same ids, RSVPs included). */
export async function restoreDeletedInvite(logId: string, ctx: WriteCtx): Promise<{ ok: true } | { ok: false; error: string }> {
  return withAudit(ctx, async (tx: Tx) => {
    const log = await tx.auditLog.findUnique({ where: { id: logId } });
    if (!log || log.action !== "admin_delete") return { ok: false, error: "Nothing to restore." };
    const already = await tx.auditLog.findFirst({ where: { action: "admin_restore", refLogId: logId } });
    if (already) return { ok: false, error: "Already restored." };
    const rows = ((log.before as { guests?: Row[] } | null)?.guests ?? []) as Row[];
    const clash = await tx.guest.findMany({ where: { OR: [{ id: { in: rows.map((r) => r.id) } }, { fullName: { in: rows.map((r) => r.fullName) } }] } });
    if (clash.length) return { ok: false, error: `Can't restore — already on the list: ${clash.map((c) => c.fullName).join(", ")}` };
    // Primary first, then members (foreign key order).
    const ordered = [...rows].sort((a, b) => Number(b.isPrimaryContact) - Number(a.isPrimaryContact));
    for (const r of ordered) {
      const { updatedAt: _u, ...rest } = r;
      void _u;
      await tx.guest.create({
        data: {
          ...rest,
          submittedAt: r.submittedAt ? new Date(r.submittedAt) : null,
          createdAt: new Date(r.createdAt),
        } as never,
      });
    }
    await tx.auditLog.create({
      data: { action: "admin_restore", actor: ctx.actor, guestId: log.guestId, guestName: log.guestName, refLogId: logId },
    });
    return { ok: true as const };
  });
}
