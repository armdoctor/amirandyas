import { guestLogout } from "@/app/actions/guest-login";

export function SignOut() {
  return (
    <form action={guestLogout} className="pb-10 text-center">
      <button type="submit" className="text-[11px] uppercase tracking-[0.3em] text-ink-soft underline-offset-4 hover:text-ink hover:underline">
        Not you? Sign out
      </button>
    </form>
  );
}
