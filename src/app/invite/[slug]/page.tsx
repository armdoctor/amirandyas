import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireHousehold, serializeMembers } from "@/lib/household";
import { EVENTS, eventBySlug } from "@/lib/events";
import { pickPromptForId } from "@/lib/notePrompts";
import { DEMO_MODE } from "@/lib/config";
import { RsvpForm } from "@/components/RsvpForm";
import { SignOut } from "@/components/SignOut";
import { Detail, FaqList, Hero, HeroTitle, Section, SignOff, VenueBlock } from "@/components/InviteSections";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = eventBySlug(slug);
  if (!event) notFound();

  const household = await requireHousehold();
  if (!household.events.includes(event.key)) redirect("/invite");

  const single = household.events.length === 1;
  const invitedHere = household.members.filter((m) => m.invitedTo.includes(event.key));
  const others = household.events.filter((k) => k !== event.key);

  return (
    <main className="relative min-h-svh bg-sand-100">
      {!single && (
        <Link
          href="/invite"
          className="absolute left-5 top-5 z-20 rounded-full bg-black/25 px-3 py-1.5 text-[11px] uppercase tracking-[0.3em] text-sand-50 backdrop-blur-sm hover:bg-black/40"
        >
          ← Your invitation
        </Link>
      )}

      <Hero image={event.photo} position={event.photoPosition} align={event.heroAlign}>
        <HeroTitle
          eyebrow={single ? `Dear ${household.primary.firstName}, you're invited to` : event.kicker}
          line={event.name}
          sub={event.dateLabel}
        />
      </Hero>

      <Section>
        <p className="text-center font-serif text-2xl italic leading-relaxed text-ink">{event.blurb}</p>
        {!single && invitedHere.length < household.members.length && (
          <p className="mt-6 text-center text-sm text-ink-soft">
            Invited to this one: {invitedHere.map((m) => m.firstName).join(", ")}
          </p>
        )}
      </Section>

      <Section eyebrow="The details" title="When">
        <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-3">
          <Detail label="Date">{event.dateLabel}</Detail>
          <Detail label="Time">{event.timeLabel}</Detail>
          <Detail label="Arrival">
            {event.seatedBy}
          </Detail>
        </div>
      </Section>

      <Section eyebrow="Where" title="The venue">
        <VenueBlock />
      </Section>

      {single ? (
        <>
          <Section eyebrow="RSVP" title="Will you join us?" id="rsvp">
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
        </>
      ) : (
        <Section>
          <div className="rounded-sm border border-sand-300 bg-sand-50 p-8 text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold">RSVP</p>
            <p className="mt-3 font-serif text-2xl text-ink">One reply for all your celebrations</p>
            <p className="mt-2 font-serif text-lg text-ink-soft">
              You&rsquo;re also invited to {others.map((k) => EVENTS[k].name).join(", ").replace(/, ([^,]*)$/, " and $1")}.
              Your RSVP for everything lives on your main invitation.
            </p>
            <Link
              href="/invite#rsvp"
              className="mt-6 inline-block rounded-sm bg-ink px-5 py-3 text-xs font-medium uppercase tracking-[0.3em] text-sand-50 transition hover:bg-ink/90"
            >
              Go to RSVP
            </Link>
          </div>
        </Section>
      )}

      <SignOff />
      <SignOut />
    </main>
  );
}
