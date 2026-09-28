import type { EventKey } from "@/lib/events";
import type { Guest } from "@/lib/types";

// Sample guest list used in preview/demo mode. These are made-up people so the
// couple can click through every kind of invitation before the real list is
// loaded. Nothing here is real data.

type Seed = {
  first: string;
  last: string;
  events: EventKey[];
  plusOne?: boolean;
  members?: { first: string; last?: string; events?: EventKey[] }[];
  rsvp?: {
    attending: Partial<Record<EventKey, boolean>>;
    dietary?: string;
    message?: string;
    plusOne?: { name: string } | false;
    memberAttending?: Partial<Record<EventKey, boolean>>[];
  };
};

const ALL_YASMIN: EventKey[] = ["yasminFamily", "yasminFriends"];
const ALL_AMIR: EventKey[] = ["amirFriends", "amirFamily"];

export const DEMO_SEEDS: Seed[] = [
  // Close family on both sides — invited to everything, including the nikah.
  {
    first: "Rashid",
    last: "Hamzah",
    events: ["nikah", "yasminFamily", "amirFamily"],
    members: [{ first: "Noraini" }, { first: "Irfan" }],
  },
  // Yasmin's aunt — nikah + Yasmin's family lunch; has replied.
  {
    first: "Salmah",
    last: "Ismail",
    events: ["nikah", "yasminFamily"],
    members: [{ first: "Kamal" }],
    rsvp: {
      attending: { nikah: true, yasminFamily: true },
      dietary: "No seafood",
      message: "Yasmin used to 'host' tea parties for the cats. We're so proud.",
      memberAttending: [{ nikah: false, yasminFamily: true }],
    },
  },
  // Yasmin's friend — solo with plus-one.
  { first: "Aisyah", last: "Rahman", events: ["yasminFriends"], plusOne: true },
  // Friend of both — invited to both friends' receptions.
  { first: "Daniel", last: "Lim", events: ["yasminFriends", "amirFriends"], plusOne: true },
  // Amir's friend — solo, replied yes with plus-one.
  {
    first: "Hafiz",
    last: "Osman",
    events: ["amirFriends"],
    plusOne: true,
    rsvp: {
      attending: { amirFriends: true },
      plusOne: { name: "Farah Aziz" },
      message: "Amir once drove 40 minutes back for a forgotten bubble tea.",
    },
  },
  // Amir's family — family lunch only.
  {
    first: "Zulkifli",
    last: "Abdullah",
    events: ["amirFamily"],
    members: [{ first: "Rohana" }, { first: "Adam" }, { first: "Hana" }],
  },
  // Amir's family — nikah + both of Amir's.
  { first: "Nadia", last: "Karim", events: ["nikah", ...ALL_AMIR] },
  // Yasmin's colleague — declined.
  {
    first: "Priya",
    last: "Nair",
    events: ["yasminFriends"],
    rsvp: {
      attending: { yasminFriends: false },
      message: "So sorry to miss it — sending all the love from London!",
    },
  },
  // Family friend — every reception.
  {
    first: "Hassan",
    last: "Ali",
    events: [...ALL_YASMIN, ...ALL_AMIR],
    members: [{ first: "Mariam" }],
  },
  { first: "Sofia", last: "Tan", events: ["amirFriends"], plusOne: false },
];

function slugId(first: string, last: string) {
  return `demo-${first}-${last}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export function buildDemoGuests(): Guest[] {
  const out: Guest[] = [];
  const now = new Date().toISOString();
  for (const s of DEMO_SEEDS) {
    const id = slugId(s.first, s.last);
    const replied = !!s.rsvp;
    const primary: Guest = {
      id,
      firstName: s.first,
      lastName: s.last,
      fullName: `${s.first} ${s.last}`,
      isPrimaryContact: true,
      primaryGuestId: null,
      invitedTo: [...s.events],
      plusOneAllowed: !!s.plusOne && !s.members?.length,
      hasResponded: replied,
      attending: replied ? { ...s.rsvp!.attending } : {},
      dietaryRestrictions: s.rsvp?.dietary ?? null,
      plusOneAttending: s.rsvp?.plusOne ? true : s.rsvp?.plusOne === false ? false : null,
      plusOneName: s.rsvp?.plusOne ? s.rsvp.plusOne.name : null,
      plusOneDietary: null,
      message: s.rsvp?.message ?? null,
      submittedAt: replied ? now : null,
      createdAt: now,
    };
    out.push(primary);
    s.members?.forEach((m, i) => {
      const last = m.last ?? s.last;
      out.push({
        id: slugId(m.first, last),
        firstName: m.first,
        lastName: last,
        fullName: `${m.first} ${last}`,
        isPrimaryContact: false,
        primaryGuestId: id,
        invitedTo: [...(m.events ?? s.events)],
        plusOneAllowed: false,
        hasResponded: replied,
        attending: replied ? { ...(s.rsvp!.memberAttending?.[i] ?? s.rsvp!.attending) } : {},
        dietaryRestrictions: null,
        plusOneAttending: null,
        plusOneName: null,
        plusOneDietary: null,
        message: null,
        submittedAt: replied ? now : null,
        createdAt: now,
      });
    });
  }
  return out;
}

// Names shown on the landing page in preview mode so reviewers can try each
// kind of invitation.
export const DEMO_LOGIN_HINTS: { name: string; note: string }[] = [
  { name: "Rashid Hamzah", note: "Family of 3 · Nikah + both family lunches" },
  { name: "Aisyah Rahman", note: "Solo + plus-one · Yasmin's friends" },
  { name: "Daniel Lim", note: "Both friends' receptions" },
  { name: "Hassan Ali", note: "Couple · All four receptions" },
  { name: "Zulkifli Abdullah", note: "Family of 4 · Amir's family lunch" },
];
