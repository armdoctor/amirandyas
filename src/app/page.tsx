import Image from "next/image";
import Link from "next/link";
import { NameLoginForm } from "@/components/NameLoginForm";
import { Names } from "@/components/InviteSections";
import { DEMO_MODE } from "@/lib/config";
import { DEMO_LOGIN_HINTS } from "@/lib/demoData";

export default async function Home({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const sessionNote = reason === "session" ? "Your session expired. Please enter your name again." : null;

  return (
    <main className="min-h-svh bg-sand-100 text-ink">
      <section className="relative h-[78svh] min-h-[520px] w-full overflow-hidden">
        <Image
          src="/photos/sky.jpg"
          alt="Amir and Yasmin facing each other against a soft evening sky"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_85%]"
        />
        {/* Fade the bottom of the photo into the page. */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-sand-100" />
        <div className="film-grain relative z-10 flex h-full flex-col items-center px-6 pt-14 text-center sm:pt-20">
          <p className="rise text-[11px] uppercase tracking-[0.35em] text-ink/70 sm:tracking-[0.5em]">March 2027 · Singapore</p>
          <Names className="rise rise-2 mt-6 text-[clamp(3.5rem,11vw,8rem)] text-ink" />
          <p className="rise rise-3 mt-5 max-w-md font-serif text-xl italic text-ink/80">
            are getting married — and we&rsquo;d love for you to be there.
          </p>
        </div>
      </section>

      <section className="relative z-10 -mt-24 px-4 pb-20 sm:-mt-12 sm:px-6">
        <div className="mx-auto w-full max-w-sm space-y-5 rounded-sm bg-white/80 px-6 py-7 shadow-[0_20px_60px_-30px_rgba(58,48,41,0.35)] ring-1 ring-sand-300 backdrop-blur">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.35em] text-gold">You&rsquo;re invited</p>
            <p className="mt-2 font-serif text-lg text-ink">Enter your full name to open your invitation.</p>
          </div>
          {sessionNote && (
            <p className="rounded-sm bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">{sessionNote}</p>
          )}
          <NameLoginForm hints={DEMO_MODE ? DEMO_LOGIN_HINTS : undefined} />
          <p className="text-center font-serif text-base text-ink-soft">
            Can&rsquo;t find your invitation? Reach out to Amir or Yasmin directly.
          </p>
        </div>
        {DEMO_MODE && (
          <p className="mt-8 text-center text-xs text-ink-soft">
            Preview build ·{" "}
            <Link href="/admin/login" className="underline underline-offset-4 hover:text-ink">
              couple&rsquo;s dashboard
            </Link>
          </p>
        )}
      </section>
    </main>
  );
}
