"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EVENT_KEYS } from "@/lib/events";
import { getGuestSession } from "@/lib/auth";
import { loadHousehold } from "@/lib/household";
import { updateMany } from "@/lib/store";
import type { Attendance } from "@/lib/types";

const AttendanceSchema = z.partialRecord(z.enum(EVENT_KEYS), z.boolean().nullable());

const MemberRsvpSchema = z.object({
  guestId: z.string().min(1),
  attending: AttendanceSchema,
  dietaryRestrictions: z.string().max(500).optional().default(""),
  plusOneAttending: z.boolean().nullable().optional(),
  plusOneName: z.string().max(120).optional().default(""),
  plusOneDietary: z.string().max(500).optional().default(""),
});

const RsvpPayloadSchema = z.object({
  members: z.array(MemberRsvpSchema).min(1),
  message: z.string().max(2000).optional().default(""),
});

export type RsvpPayload = z.input<typeof RsvpPayloadSchema>;
export type RsvpResult = { ok: true } | { ok: false; error: string };

export async function submitRsvp(payload: RsvpPayload): Promise<RsvpResult> {
  const guestId = await getGuestSession();
  if (!guestId) return { ok: false, error: "Your session expired. Please enter your name again." };

  const household = await loadHousehold(guestId);
  if (!household) return { ok: false, error: "We couldn't load your invitation." };

  const parsed = RsvpPayloadSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Some fields are invalid. Please review and try again." };

  const byId = new Map(household.members.map((m) => [m.id, m]));
  for (const m of parsed.data.members) {
    if (!byId.has(m.guestId)) return { ok: false, error: "Invalid household member in submission." };
  }

  const isSolo = household.members.length === 1;
  const now = new Date().toISOString();

  await updateMany(
    parsed.data.members.map((m) => {
      const guest = byId.get(m.guestId)!;
      // Only keep answers for events this person is actually invited to.
      const attending: Attendance = {};
      for (const k of guest.invitedTo) attending[k] = m.attending[k] ?? null;
      const canHavePlusOne = isSolo && guest.plusOneAllowed;
      return {
        id: guest.id,
        patch: {
          attending,
          dietaryRestrictions: m.dietaryRestrictions?.trim() || null,
          plusOneAttending: canHavePlusOne ? (m.plusOneAttending ?? null) : null,
          plusOneName: canHavePlusOne ? m.plusOneName?.trim() || null : null,
          plusOneDietary: canHavePlusOne ? m.plusOneDietary?.trim() || null : null,
          message: guest.id === household.primary.id ? parsed.data.message?.trim() || null : null,
          hasResponded: true,
          submittedAt: now,
        },
      };
    }),
    { action: "rsvp", actor: "guest" },
  );

  revalidatePath("/admin");
  revalidatePath("/invite", "layout");
  return { ok: true };
}
