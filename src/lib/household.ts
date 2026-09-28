import { redirect } from "next/navigation";
import { EVENT_KEYS, type EventKey } from "@/lib/events";
import type { Guest } from "@/lib/types";
import { getGuest, householdMembers } from "@/lib/store";
import { getGuestSession } from "@/lib/auth";

export type Household = {
  primary: Guest;
  members: Guest[]; // includes primary first
  events: EventKey[]; // union of everyone's invitations, chronological
};

export async function loadHousehold(primaryId: string): Promise<Household | null> {
  const primary = await getGuest(primaryId);
  if (!primary || !primary.isPrimaryContact) return null;
  const others = await householdMembers(primary.id);
  const members = [primary, ...others];
  const set = new Set(members.flatMap((m) => m.invitedTo));
  const events = EVENT_KEYS.filter((k) => set.has(k));
  return { primary, members, events };
}

export async function requireHousehold(): Promise<Household> {
  const id = await getGuestSession();
  if (!id) redirect("/");
  const h = await loadHousehold(id);
  if (!h || h.events.length === 0) redirect("/");
  return h;
}

// Plain, serialisable shape handed to the client RSVP form.
export type MemberRow = Pick<
  Guest,
  | "id"
  | "firstName"
  | "lastName"
  | "fullName"
  | "invitedTo"
  | "plusOneAllowed"
  | "hasResponded"
  | "attending"
  | "dietaryRestrictions"
  | "plusOneAttending"
  | "plusOneName"
  | "plusOneDietary"
>;

export function serializeMembers(members: Guest[]): MemberRow[] {
  return members.map((g) => ({
    id: g.id,
    firstName: g.firstName,
    lastName: g.lastName,
    fullName: g.fullName,
    invitedTo: g.invitedTo,
    plusOneAllowed: g.plusOneAllowed,
    hasResponded: g.hasResponded,
    attending: g.attending,
    dietaryRestrictions: g.dietaryRestrictions,
    plusOneAttending: g.plusOneAttending,
    plusOneName: g.plusOneName,
    plusOneDietary: g.plusOneDietary,
  }));
}
