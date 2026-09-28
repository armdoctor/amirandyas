import Image from "next/image";
import Link from "next/link";

export default async function NotPrimary({ searchParams }: { searchParams: Promise<{ primary?: string }> }) {
  const { primary } = await searchParams;
  return (
    <main className="relative min-h-svh overflow-hidden bg-ink text-sand-50">
      <Image src="/photos/starburst.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[center_65%]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/75" />
      <div className="film-grain relative z-10 mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.45em] text-sand-100/80">You&rsquo;re on the list</p>
        <h1 className="mt-6 font-serif text-4xl font-light leading-tight">
          Your invitation is being managed by <span className="italic">{primary || "your household"}</span>.
        </h1>
        <p className="mt-6 max-w-sm text-sm text-sand-100/85">
          They&rsquo;ll RSVP for your whole household — please reply through them.
        </p>
        <Link
          href="/"
          className="mt-12 inline-block border-b border-sand-100/40 pb-1 text-[11px] uppercase tracking-[0.3em] text-sand-100/85 hover:border-sand-50"
        >
          ← Back
        </Link>
      </div>
    </main>
  );
}
