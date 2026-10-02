"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EVENT_KEYS } from "@/lib/events";
import { isAdmin } from "@/lib/auth";
import {
  createInvite,
  deleteInvite,
  restoreDeletedInvite,
  findGuestsByFullNames,
  fullNameOf,
  getGuest,
  householdMembers,
  normalizeName,
  updateGuestRecord,
} from "@/lib/store";
import type { Attendance } from "@/lib/types";

const NameSchema = z.string().trim().min(1).max(80);
const EventsSchema = z.array(z.enum(EVENT_KEYS));

const MemberSchema = z.object({
  firstName: NameSchema,
  lastName: NameSchema,
  invitedTo: EventsSchema,
});

const AddGuestSchema = z.object({
  firstName: NameSchema,
  lastName: NameSchema,
  invitedTo: EventsSchema,
  plusOneAllowed: z.boolean(),
  members: z.array(MemberSchema).default([]),
});

const UpdateGuestSchema = z.object({
  firstName: NameSchema,
  lastName: NameSchema,
  invitedTo: EventsSchema,
  plusOneAllowed: z.boolean(),
  hasResponded: z.boolean().optional(),
  attending: z.partialRecord(z.enum(EVENT_KEYS), z.boolean().nullable()).optional(),
  dietaryRestrictions: z.string().max(500).optional().nullable(),
  plusOneAttending: z.boolean().nullable().optional(),
  plusOneName: z.string().max(120).optional().nullable(),
  plusOneDietary: z.string().max(500).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
});

export type AddGuestPayload = z.input<typeof AddGuestSchema>;
export type UpdateGuestPayload = z.input<typeof UpdateGuestSchema>;
export type ActionResult = { ok: true } | { ok: false; error: string };

async function denied(): Promise<ActionResult | null> {
  return (await isAdmin()) ? null : { ok: false, error: "Not authorized." };
}

export async function addGuest(payload: AddGuestPayload): Promise<ActionResult> {
  const d = await denied();
  if (d) return d;
  const parsed = AddGuestSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Some fields are invalid. Check the form." };
  const data = parsed.data;
  if (data.invitedTo.length === 0) return { ok: false, error: "Pick at least one event for the primary contact." };

  const names = [fullNameOf(data.firstName, data.lastName), ...data.members.map((m) => fullNameOf(m.firstName, m.lastName))];
  if (new Set(names.map(normalizeName)).size !== names.length) return { ok: false, error: "Duplicate names in this invite." };
  const clash = await findGuestsByFullNames(names);
  if (clash.length) return { ok: false, error: `Already in guest list: ${clash.map((c) => c.fullName).join(", ")}` };

  await createInvite(
    { firstName: data.firstName, lastName: data.lastName, invitedTo: data.invitedTo, plusOneAllowed: data.plusOneAllowed },
    data.members.map((m) => ({ ...m, plusOneAllowed: false })),
    { action: "admin_add", actor: "admin" },
  );
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateGuest(id: string, payload: UpdateGuestPayload): Promise<ActionResult> {
  const d = await denied();
  if (d) return d;
  const parsed = UpdateGuestSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Some fields are invalid. Check the form." };
  const data = parsed.data;

  const existing = await getGuest(id);
  if (!existing) return { ok: false, error: "Guest not found." };

  const newFullName = fullNameOf(data.firstName, data.lastName);
  if (normalizeName(newFullName) !== normalizeName(existing.fullName)) {
    const clash = await findGuestsByFullNames([newFullName]);
    if (clash.some((c) => c.id !== id)) return { ok: false, error: `Already in guest list: ${newFullName}` };
  }

  // Plus-one only for solo primaries.
  let plusOneAllowed = data.plusOneAllowed;
  if (!existing.isPrimaryContact || (await householdMembers(id)).length > 0) plusOneAllowed = false;

  const attending: Attendance | undefined = data.attending
    ? Object.fromEntries(data.invitedTo.map((k) => [k, data.attending?.[k] ?? null]))
    : undefined;

  await updateGuestRecord(id, {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    fullName: newFullName,
    invitedTo: data.invitedTo,
    plusOneAllowed,
    ...(data.hasResponded !== undefined ? { hasResponded: data.hasResponded } : {}),
    ...(attending ? { attending } : {}),
    ...(data.dietaryRestrictions !== undefined ? { dietaryRestrictions: data.dietaryRestrictions || null } : {}),
    ...(data.plusOneAttending !== undefined ? { plusOneAttending: plusOneAllowed ? data.plusOneAttending : null } : {}),
    ...(data.plusOneName !== undefined ? { plusOneName: plusOneAllowed ? data.plusOneName || null : null } : {}),
    ...(data.plusOneDietary !== undefined ? { plusOneDietary: plusOneAllowed ? data.plusOneDietary || null : null } : {}),
    ...(data.message !== undefined ? { message: existing.isPrimaryContact ? data.message || null : null } : {}),
  }, { action: "admin_update", actor: "admin" });

  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteGuest(id: string): Promise<ActionResult> {
  const d = await denied();
  if (d) return d;
  const ok = await deleteInvite(id, { action: "admin_delete", actor: "admin" });
  if (!ok) return { ok: false, error: "Guest not found." };
  revalidatePath("/admin");
  return { ok: true };
}

export async function restoreInvite(logId: string): Promise<ActionResult> {
  const d = await denied();
  if (d) return d;
  const r = await restoreDeletedInvite(logId, { action: "admin_restore", actor: "admin" });
  if (r.ok) revalidatePath("/admin");
  return r;
}
