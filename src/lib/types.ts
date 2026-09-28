import type { EventKey } from "@/lib/events";

export type Attendance = Partial<Record<EventKey, boolean | null>>;

export type Guest = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;

  // Household: the primary contact RSVPs for everyone linked to them.
  isPrimaryContact: boolean;
  primaryGuestId: string | null;

  // Which celebrations this person is invited to.
  invitedTo: EventKey[];

  // Only meaningful for solo primaries (households have no plus-ones).
  plusOneAllowed: boolean;

  // RSVP state — per-event attendance is null/undefined until answered.
  hasResponded: boolean;
  attending: Attendance;
  dietaryRestrictions: string | null;

  // Plus-one joins the primary at whichever events the primary attends.
  plusOneAttending: boolean | null;
  plusOneName: string | null;
  plusOneDietary: string | null;

  message: string | null;
  submittedAt: string | null; // ISO
  createdAt: string; // ISO
};
