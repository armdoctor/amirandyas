// Single source of truth for the five celebrations. Everything else — the
// invite pages, the RSVP form, the admin dashboard, CSV import/export — reads
// from this list, so adding/renaming an event only needs a change here.

export const EVENT_KEYS = [
  "nikah",
  "yasminFamily",
  "yasminFriends",
  "amirFriends",
  "amirFamily",
] as const;

export type EventKey = (typeof EVENT_KEYS)[number];

export type Side = "both" | "yasmin" | "amir";

export type EventInfo = {
  key: EventKey;
  slug: string; // URL segment: /invite/<slug>
  name: string; // "Yasmin's Family Reception"
  shortName: string; // compact label for admin tables
  kicker: string; // small eyebrow text on cards
  side: Side;
  dateISO: string;
  dateLabel: string; // "Saturday, 13 March 2027"
  dateShort: string; // "Sat 13 Mar"
  timeLabel: string; // "11:00 am – 1:00 pm"
  seatedBy: string; // "Please be seated by 11:30 am"
  photo: string;
  photoPosition: string;
  heroAlign?: "top" | "bottom";
  blurb: string;
};

export const VENUE = {
  hall: "Waterfall",
  name: "Furama RiverFront",
  address: "405 Havelock Road, Singapore 169633",
  mapsQuery: "Furama RiverFront, 405 Havelock Rd, Singapore 169633",
};

export const EVENTS: Record<EventKey, EventInfo> = {
  nikah: {
    key: "nikah",
    slug: "nikah",
    name: "The Solemnisation",
    shortName: "Nikah",
    kicker: "Akad Nikah",
    side: "both",
    dateISO: "2027-03-13",
    dateLabel: "Saturday, 13 March 2027",
    dateShort: "Sat 13 Mar",
    timeLabel: "9:00 am – 10:00 am",
    seatedBy: "Please be seated by 9:00 am",
    photo: "/photos/sky.jpg",
    photoPosition: "center 85%",
    heroAlign: "top",
    blurb: "Our nikah, witnessed by those closest to us.",
  },
  yasminFamily: {
    key: "yasminFamily",
    slug: "yasmin-family",
    name: "Yasmin's Family Reception",
    shortName: "Y · Family",
    kicker: "Yasmin's side",
    side: "yasmin",
    dateISO: "2027-03-13",
    dateLabel: "Saturday, 13 March 2027",
    dateShort: "Sat 13 Mar",
    timeLabel: "11:00 am – 1:00 pm",
    seatedBy: "Please be seated by 11:30 am",
    photo: "/photos/bouquet.jpg",
    photoPosition: "center 30%",
    blurb: "A long, warm lunch with Yasmin's family.",
  },
  yasminFriends: {
    key: "yasminFriends",
    slug: "yasmin-friends",
    name: "Yasmin's Friends Reception",
    shortName: "Y · Friends",
    kicker: "Yasmin's side",
    side: "yasmin",
    dateISO: "2027-03-13",
    dateLabel: "Saturday, 13 March 2027",
    dateShort: "Sat 13 Mar",
    timeLabel: "2:00 pm – 4:00 pm",
    seatedBy: "Please be seated by 2:30 pm",
    photo: "/photos/airplane.jpg",
    photoPosition: "center 40%",
    blurb: "An afternoon with the friends who've known Yasmin best.",
  },
  amirFriends: {
    key: "amirFriends",
    slug: "amir-friends",
    name: "Amir's Friends Reception",
    shortName: "A · Friends",
    kicker: "Amir's side",
    side: "amir",
    dateISO: "2027-03-14",
    dateLabel: "Sunday, 14 March 2027",
    dateShort: "Sun 14 Mar",
    timeLabel: "2:00 pm – 4:00 pm",
    seatedBy: "Please be seated by 2:30 pm",
    photo: "/photos/dance.jpg",
    photoPosition: "center 55%",
    blurb: "An afternoon with the friends who've known Amir best.",
  },
  amirFamily: {
    key: "amirFamily",
    slug: "amir-family",
    name: "Amir's Family Reception",
    shortName: "A · Family",
    kicker: "Amir's side",
    side: "amir",
    dateISO: "2027-03-15",
    dateLabel: "Monday, 15 March 2027",
    dateShort: "Mon 15 Mar",
    timeLabel: "11:00 am – 1:00 pm",
    seatedBy: "Please be seated by 11:30 am",
    photo: "/photos/golden.jpg",
    photoPosition: "center 45%",
    blurb: "A long, warm lunch with Amir's family.",
  },
};

export const EVENT_LIST: EventInfo[] = EVENT_KEYS.map((k) => EVENTS[k]);

export function eventBySlug(slug: string): EventInfo | null {
  return EVENT_LIST.find((e) => e.slug === slug) ?? null;
}

// Events grouped by calendar day, in chronological order.
export function groupByDay(keys: readonly EventKey[]) {
  const days = new Map<string, { dateISO: string; dateLabel: string; events: EventInfo[] }>();
  for (const e of EVENT_LIST) {
    if (!keys.includes(e.key)) continue;
    const d = days.get(e.dateISO) ?? { dateISO: e.dateISO, dateLabel: e.dateLabel, events: [] };
    d.events.push(e);
    days.set(e.dateISO, d);
  }
  return [...days.values()].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}
