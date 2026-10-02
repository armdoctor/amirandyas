import "server-only";
// PREVIEW-ONLY store (DEMO_MODE=1). Real guests live in Postgres — see storePrisma.ts.
import { randomUUID } from "node:crypto";
import type { EventKey } from "@/lib/events";
import type { Guest } from "@/lib/types";
import { buildDemoGuests } from "@/lib/demoData";
import type { DeletedInvite, NewGuest, WriteCtx } from "@/lib/storeTypes";

/**
 * Data layer. Every read/write of the guest list goes through this file, so
 * swapping the in-memory preview store for a real database later only touches
 * this module.
 *
 * PREVIEW MODE: guests live in server memory, seeded from demoData.ts.
 * Changes survive only as long as the server instance stays warm — on Vercel
 * they can reset at any time. That's intentional for the demo.
 *
 * DATA SAFETY (carry these over when a real DB is added — see AGENTS.md):
 *  - No unbounded bulk deletes. Deleting is per-guest / per-household only.
 *  - CSV import is merge-only: existing guests are never overwritten or removed.
 */

type Db = { guests: Map<string, Guest> };

const g = globalThis as unknown as { __ayStore?: Db };

function db(): Db {
  if (!g.__ayStore) {
    g.__ayStore = { guests: new Map(buildDemoGuests().map((x) => [x.id, x])) };
  }
  return g.__ayStore;
}

function clone<T>(v: T): T {
  return structuredClone(v);
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function fullNameOf(first: string, last: string) {
  return `${first.trim()} ${last.trim()}`.replace(/\s+/g, " ").trim();
}

// ---- Reads ----

export async function listGuests(): Promise<Guest[]> {
  return [...db().guests.values()]
    .map(clone)
    .sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName),
    );
}

export async function getGuest(id: string): Promise<Guest | null> {
  const x = db().guests.get(id);
  return x ? clone(x) : null;
}

export async function findGuestByName(name: string): Promise<Guest | null> {
  const n = normalizeName(name);
  if (!n) return null;
  for (const x of db().guests.values()) {
    if (normalizeName(x.fullName) === n) return clone(x);
  }
  return null;
}

export async function findGuestsByFullNames(names: string[]): Promise<Guest[]> {
  const wanted = new Set(names.map(normalizeName));
  return [...db().guests.values()].filter((x) => wanted.has(normalizeName(x.fullName))).map(clone);
}

export async function householdMembers(primaryId: string): Promise<Guest[]> {
  return [...db().guests.values()]
    .filter((x) => x.primaryGuestId === primaryId)
    .sort((a, b) => a.firstName.localeCompare(b.firstName))
    .map(clone);
}

// ---- Writes ----


function blankGuest(input: NewGuest, primaryId: string | null): Guest {
  return {
    id: randomUUID(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    fullName: fullNameOf(input.firstName, input.lastName),
    isPrimaryContact: primaryId === null,
    primaryGuestId: primaryId,
    invitedTo: [...input.invitedTo],
    plusOneAllowed: primaryId === null ? input.plusOneAllowed : false,
    hasResponded: false,
    attending: {},
    dietaryRestrictions: null,
    plusOneAttending: null,
    plusOneName: null,
    plusOneDietary: null,
    message: null,
    submittedAt: null,
    createdAt: new Date().toISOString(),
  };
}

/** Create a primary contact plus any household members, atomically. */
export async function createInvite(primary: NewGuest, members: NewGuest[], _ctx?: WriteCtx): Promise<Guest> {
  const p = blankGuest({ ...primary, plusOneAllowed: members.length ? false : primary.plusOneAllowed }, null);
  const ms = members.map((m) => blankGuest(m, p.id));
  const store = db().guests;
  store.set(p.id, p);
  for (const m of ms) store.set(m.id, m);
  return clone(p);
}

export async function createMember(primaryId: string, member: NewGuest, _ctx?: WriteCtx): Promise<Guest> {
  const m = blankGuest(member, primaryId);
  db().guests.set(m.id, m);
  return clone(m);
}

export async function updateGuestRecord(id: string, patch: Partial<Omit<Guest, "id">>, _ctx?: WriteCtx): Promise<Guest | null> {
  const store = db().guests;
  const existing = store.get(id);
  if (!existing) return null;
  const next = { ...existing, ...clone(patch) };
  store.set(id, next);
  return clone(next);
}

/** Apply several guest updates together (used for a household RSVP). */
export async function updateMany(updates: { id: string; patch: Partial<Omit<Guest, "id">> }[], _ctx?: WriteCtx) {
  const store = db().guests;
  // Validate first so we never half-apply.
  for (const u of updates) if (!store.has(u.id)) throw new Error(`Guest not found: ${u.id}`);
  for (const u of updates) store.set(u.id, { ...store.get(u.id)!, ...clone(u.patch) });
}

/**
 * Delete ONE guest. If they're a primary, their household members go too
 * (that's one invite). There is deliberately no "delete all".
 */
export async function deleteInvite(id: string, _ctx?: WriteCtx): Promise<boolean> {
  const store = db().guests;
  const x = store.get(id);
  if (!x) return false;
  if (x.isPrimaryContact) {
    for (const m of [...store.values()]) if (m.primaryGuestId === id) store.delete(m.id);
  }
  store.delete(id);
  return true;
}

export async function listDeletedInvites(): Promise<DeletedInvite[]> {
  return [];
}

export async function restoreDeletedInvite(_logId: string, _ctx?: WriteCtx): Promise<{ ok: true } | { ok: false; error: string }> {
  return { ok: false, error: "Restore isn't available in preview mode." };
}
