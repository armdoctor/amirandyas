import Image from "next/image";
import Link from "next/link";
import { EVENTS, VENUE, groupByDay, type EventInfo, type EventKey } from "@/lib/events";
import { FAQS } from "@/lib/faqs";

export function Hero({
  image,
  position = "center",
  children,
  tall = true,
  align = "bottom",
  mobileImage,
  mobilePosition = "center",
}: {
  image: string;
  mobileImage?: string;
  mobilePosition?: string;
  position?: string;
  children: React.ReactNode;
  tall?: boolean;
  align?: "top" | "bottom";
}) {
  return (
    <header
      className={`relative w-full overflow-hidden bg-ink ${tall ? "h-[88svh] min-h-[560px]" : "h-[62svh] min-h-[440px]"}`}
    >
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="100vw"
        className={`object-cover ${mobileImage ? "hidden sm:block" : ""}`}
        style={{ objectPosition: position }}
      />
      {mobileImage && (
        <Image
          src={mobileImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover sm:hidden"
          style={{ objectPosition: mobilePosition }}
        />
      )}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${align === "top" ? "from-black/45 via-black/10 to-black/20" : "from-black/25 via-black/15 to-black/65"}`}
      />
      <div
        className={`film-grain relative z-10 flex h-full flex-col items-center px-6 text-center text-sand-50 ${align === "top" ? "justify-start pt-20 sm:pt-24" : "justify-end pb-14 sm:pb-20"}`}
      >
        {children}
      </div>
    </header>
  );
}

export function Names({ className = "" }: { className?: string }) {
  return (
    <h1 className={`font-serif font-light leading-[0.95] ${className}`}>
      Amir <span className="font-extralight italic">&amp;</span> Yasmin
    </h1>
  );
}

export function HeroTitle({ eyebrow, line, sub }: { eyebrow: string; line: string; sub: string }) {
  return (
    <div className="rise space-y-5">
      <p className="text-[11px] uppercase tracking-[0.5em] text-sand-100/85">{eyebrow}</p>
      <Names className="text-[clamp(3rem,9vw,6.5rem)] text-sand-50" />
      <div className="mx-auto h-px w-16 bg-sand-100/50" />
      <p className="font-serif text-xl italic text-sand-100 sm:text-2xl">{line}</p>
      <p className="text-[11px] uppercase tracking-[0.4em] text-sand-100/80">{sub}</p>
    </div>
  );
}

export function Section({
  eyebrow,
  title,
  children,
  wide = false,
  id,
}: {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-6 px-4 py-14 sm:px-6 sm:py-20">
      <div className={`mx-auto ${wide ? "max-w-4xl" : "max-w-2xl"}`}>
        {(eyebrow || title) && (
          <header className="mb-10 text-center">
            {eyebrow && <p className="text-[11px] uppercase tracking-[0.4em] text-gold">{eyebrow}</p>}
            {title && <h2 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">{title}</h2>}
            <div className="mx-auto mt-4 h-px w-12 bg-sand-400" />
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

export function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{label}</p>
      <div className="font-serif text-xl leading-snug text-ink">{children}</div>
    </div>
  );
}

export function FullBleedImage({ src, position = "center", height = "h-[55svh]" }: { src: string; position?: string; height?: string }) {
  return (
    <div className={`relative w-full overflow-hidden ${height}`}>
      <Image src={src} alt="" fill sizes="100vw" className="object-cover" style={{ objectPosition: position }} />
    </div>
  );
}

/** Timeline of the household's events, grouped by day, each linking to its page. */
export function EventTimeline({ events }: { events: EventKey[] }) {
  const days = groupByDay(events);
  return (
    <div className="space-y-12">
      {days.map((day) => (
        <div key={day.dateISO}>
          <div className="mb-5 flex items-baseline gap-4">
            <span className="text-[11px] uppercase tracking-[0.35em] text-ink-soft">{day.dateLabel}</span>
            <span className="h-px flex-1 bg-sand-300" />
          </div>
          <div className={`grid gap-5 md:grid-cols-2 ${day.events.length > 2 ? "lg:grid-cols-3" : ""}`}>
            {day.events.map((e) => (
              <EventCard key={e.key} event={e} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EventCard({ event }: { event: EventInfo }) {
  return (
    <Link
      href={`/invite/${event.slug}`}
      className="group block overflow-hidden rounded-sm bg-sand-50 ring-1 ring-sand-300 transition hover:ring-sand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
    >
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={event.photo}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ objectPosition: event.photoPosition }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <p className="absolute bottom-3 left-4 text-[10px] uppercase tracking-[0.3em] text-sand-50/90">{event.kicker}</p>
      </div>
      <div className="space-y-2 p-5">
        <h3 className="font-serif text-2xl leading-tight text-ink">{event.name}</h3>
        <p className="text-sm text-ink-soft">{event.timeLabel}</p>
        <p className="text-xs italic text-ink-soft/80">{event.seatedBy}</p>
        <p className="pt-2 text-[10px] uppercase tracking-[0.3em] text-gold transition group-hover:tracking-[0.35em]">
          Details →
        </p>
      </div>
    </Link>
  );
}

export function VenueBlock() {
  return (
    <div className="space-y-5 text-center">
      <p className="font-serif text-3xl text-ink">{VENUE.hall}</p>
      <p className="font-serif text-xl italic text-ink-soft">{VENUE.name}</p>
      <p className="text-sm text-ink-soft">{VENUE.address}</p>
      <a
        href={`https://maps.google.com/?q=${encodeURIComponent(VENUE.mapsQuery)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block border-b border-sand-400 pb-0.5 text-[11px] uppercase tracking-[0.3em] text-gold hover:border-gold"
      >
        Open in Google Maps
      </a>
    </div>
  );
}

export function FaqList() {
  return (
    <div className="border-t border-sand-300">
      {FAQS.map(({ q, a }) => (
        <details key={q} className="group border-b border-sand-300">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-serif text-xl text-ink [&::-webkit-details-marker]:hidden">
            {q}
            <svg
              className="h-4 w-4 flex-shrink-0 text-gold transition-transform duration-200 group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <p className="pb-5 font-serif text-lg leading-relaxed text-ink-soft">{a}</p>
        </details>
      ))}
    </div>
  );
}

export function SignOff() {
  return (
    <footer className="px-6 pb-16 pt-6 text-center">
      <p className="font-serif text-2xl italic text-ink">With love,</p>
      <p className="mt-2 font-serif text-2xl italic text-gold">Amir &amp; Yasmin</p>
    </footer>
  );
}

export function eventNames(keys: EventKey[]) {
  return keys.map((k) => EVENTS[k].name);
}
