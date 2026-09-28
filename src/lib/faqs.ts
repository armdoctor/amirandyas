import { VENUE } from "@/lib/events";

// Placeholder answers marked [TBC] need the couple's confirmation.
export const FAQS: { q: string; a: string }[] = [
  {
    q: "Where are the celebrations?",
    a: `All five celebrations are held at ${VENUE.hall}, ${VENUE.name} — ${VENUE.address}.`,
  },
  {
    q: "What time should I arrive?",
    a: "For the solemnisation, please be seated by 9:00 am. For each reception, please be seated by 30 minutes after the start time — the exact time is on each event's page.",
  },
  {
    q: "Is there a dress code?",
    a: "[TBC] Smart or traditional attire. We'll share more closer to the date.",
  },
  {
    q: "Can I bring my children?",
    a: "If your little ones are invited, they'll be named on your invitation.",
  },
  {
    q: "Can I bring a plus one?",
    a: "If your invitation includes a plus one, you'll see the option when you RSVP.",
  },
  {
    q: "What if I have dietary restrictions?",
    a: "Please let us know in your RSVP and we'll pass it on to the venue.",
  },
  {
    q: "Is there parking?",
    a: "[TBC] Parking is available at the hotel. We'll confirm details closer to the date.",
  },
  {
    q: "When is the RSVP deadline?",
    a: "[TBC] Please RSVP by the date we'll share here, so we can confirm numbers with the venue.",
  },
  {
    q: "Who can I contact if I have questions?",
    a: "[TBC] Reach out to Amir or Yasmin directly.",
  },
];
