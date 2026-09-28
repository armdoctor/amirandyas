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


export default async function InvitationPage() {
  const household = await requireHousehold();
  if (household.events.length === 1) redirect(`/invite/${EVENTS[household.events[0]].slug}`);

  const isSolo = household.members.length === 1;
  const days = groupByDay(household.events);
  const dateSpan =
    days.length === 1
      ? days[0].dateLabel
      : `${days.map((d) => new Date(d.dateISO).getUTCDate()).join(", ").replace(/, (\d+)$/, " & $1")} March 2027`;

  return (
    <main className="min-h-svh bg-sand-100">
      <Hero image="/photos/sunset-walk.jpg" position="center 45%" mobileImage="/photos/sunset-run.jpg" mobilePosition="center 45%">
        <HeroTitle
          eyebrow={`Dear ${household.primary.firstName}`}
          line="We'd love for you to celebrate with us"
          sub={`${dateSpan} · Singapore`}
        />
      </Hero>

      <Section>
        <p className="text-center font-serif text-2xl italic leading-relaxed text-ink sm:text-3xl">
          &ldquo;Two hearts, one path — and the people we love, right beside us.&rdquo;
        </p>
        <p className="mx-auto mt-10 max-w-xl text-center font-serif text-xl leading-relaxed text-ink-soft">
          {isSolo
            ? "We'd be so happy to have you with us as we begin this next chapter. Tap below for the details, then RSVP."
            : "You and your family mean the world to us, and we'd be so happy to have you with us as we begin this next chapter. Tap below for the details, then RSVP for everyone."}
        </p>
      </Section>

      <Section eyebrow="Your invitation" title="Where we'd love you to be" wide>
        <EventTimeline events={household.events} />
      </Section>

      <FullBleedImage src="/photos/shoreline.jpg" position="center 55%" />

      <Section eyebrow="Where" title="The venue">
        <VenueBlock />
      </Section>

      <Section eyebrow="RSVP" title="Will you join us?" id="rsvp">
        <p className="mb-8 text-center font-serif text-lg text-ink-soft">
          {isSolo
            ? "Let us know if you can make it."
            : "One RSVP for your whole household — just let us know who's coming."}
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
