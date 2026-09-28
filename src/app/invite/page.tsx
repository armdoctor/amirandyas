import { redirect } from "next/navigation";
import { requireHousehold, serializeMembers } from "@/lib/household";
import { EVENTS, groupByDay } from "@/lib/events";
import { pickPromptForId } from "@/lib/notePrompts";
import { DEMO_MODE } from "@/lib/config";
import { RsvpForm } from "@/components/RsvpForm";
import { SignOut } from "@/components/SignOut";
import {
  EventTimeline,
  FaqList,
  FullBleedImage,
  Hero,
  HeroTitle,
  Section,
  SignOff,
  VenueBlock,
} from "@/components/InviteSections";

export const dynamic = "force-dynamic";

const WORDS = ["", "one", "two", "three", "four", "five"];

export default async function InvitationPage() {
  const household = await requireHousehold();
  if (household.events.length === 1) redirect(`/invite/${EVENTS[household.events[0]].slug}`);

  const isSolo = household.members.length === 1;
  const days = groupByDay(household.events);
  const count = household.events.length;
  const dateSpan =
    days.length === 1
      ? days[0].dateLabel
      : `${days.map((d) => new Date(d.dateISO).getUTCDate()).join(", ").replace(/, (\d+)$/, " & $1")} March 2027`;

  return (
    <main className="min-h-svh bg-sand-100">
      <Hero image="/photos/sunset-walk.jpg" position="center 45%" mobileImage="/photos/sunset-run.jpg" mobilePosition="center 45%">
        <HeroTitle
          eyebrow={`Dear ${household.primary.firstName}`}
          line={`You're invited to ${WORDS[count] ?? count} celebrations`}
          sub={`${dateSpan} · Singapore`}
        />
      </Hero>

      <Section>
        <p className="text-center font-serif text-2xl italic leading-relaxed text-ink sm:text-3xl">
          &ldquo;And We created you in pairs.&rdquo;
        </p>
        <p className="mt-2 text-center text-[11px] uppercase tracking-[0.3em] text-ink-soft">Surah An-Naba&rsquo; 78:8</p>
        <p className="mx-auto mt-10 max-w-xl text-center font-serif text-xl leading-relaxed text-ink-soft">
          {isSolo
            ? "We'd be so happy to have you with us as we begin this next chapter. Tap a celebration to see the details, then RSVP below."
            : "You and your family mean the world to us, and we'd be so happy to have you with us as we begin this next chapter. Tap a celebration to see the details, then RSVP for everyone below."}
        </p>
      </Section>

      <Section eyebrow="Your celebrations" title="Where we'd love you to be" wide>
        <EventTimeline events={household.events} />
      </Section>

      <FullBleedImage src="/photos/shoreline.jpg" position="center 55%" />

      <Section eyebrow="The venue" title="One place, every celebration">
        <VenueBlock />
      </Section>

      <Section eyebrow="RSVP" title="Will you join us?" id="rsvp">
        <p className="mb-8 text-center font-serif text-lg text-ink-soft">
          {isSolo
            ? "Let us know which celebrations you can make it to."
            : "One RSVP for your whole household — tell us who's coming to what."}
        </p>
        <RsvpForm
          primaryId={household.primary.id}
          members={serializeMembers(household.members)}
          initialMessage={household.primary.message ?? ""}
          notePrompt={pickPromptForId(household.primary.id)}
          demo={DEMO_MODE}
        />
      </Section>

      <Section eyebrow="FAQ" title="Good to know">
        <FaqList />
      </Section>

      <SignOff />
      <SignOut />
    </main>
  );
}
