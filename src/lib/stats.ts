import { EVENT_KEYS, type EventKey } from "@/lib/events";
import type { Guest } from "@/lib/types";

export type EventStats = { invited: number; yes: number; no: number; pending: number; plusOnes: number };
export type Stats = {
  total: number;
  households: number;
  responded: number;
  plusOnesYes: number;
  events: Record<EventKey, EventStats>;
};

export function computeStats(guests: Guest[]): Stats {
  const events = {} as Record<EventKey, EventStats>;
  for (const k of EVENT_KEYS) {
    const invited = guests.filter((g) => g.invitedTo.includes(k));
    const yes = invited.filter((g) => g.attending[k] === true).length;
    const no = invited.filter((g) => g.attending[k] === false).length;
    const plusOnes = invited.filter((g) => g.attending[k] === true && g.plusOneAttending === true).length;
    events[k] = { invited: invited.length, yes, no, pending: invited.length - yes - no, plusOnes };
  }
  return {
    total: guests.length,
    households: guests.filter((g) => g.isPrimaryContact).length,
    responded: guests.filter((g) => g.hasResponded).length,
    plusOnesYes: guests.filter((g) => g.plusOneAttending === true).length,
    events,
  };
}
