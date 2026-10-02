import type { EventKey } from "@/lib/events";

export type NewGuest = {
  firstName: string;
  lastName: string;
  invitedTo: EventKey[];
  plusOneAllowed: boolean;
};

/** Who is making a change — recorded in the audit log. */
export type WriteCtx = { action: string; actor: "guest" | "admin" };

export type DeletedInvite = {
  logId: string;
  deletedAt: string;
  primaryName: string;
  people: string[];
  hadResponded: boolean;
};
