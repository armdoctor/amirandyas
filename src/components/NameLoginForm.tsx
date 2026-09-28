"use client";

import { useActionState, useRef } from "react";
import { guestLogin, type LoginState } from "@/app/actions/guest-login";

export function NameLoginForm({ hints }: { hints?: { name: string; note: string }[] }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(guestLogin, null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-3">
        <label htmlFor="name" className="sr-only">
          Your full name
        </label>
        <input
          ref={inputRef}
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Your full name"
          className="w-full rounded-sm border border-sand-300 bg-white/90 px-3 py-3 text-base text-ink placeholder:text-ink-soft/60 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink/30"
        />
        {state?.error && <p className="text-center text-sm text-red-800">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-sm bg-ink px-4 py-3 text-xs font-medium uppercase tracking-[0.3em] text-sand-50 transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Finding you…" : "View my invitation"}
        </button>
      </form>

      {hints && hints.length > 0 && (
        <div className="rounded-sm border border-dashed border-sand-400 bg-sand-50/80 p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Preview · try a sample guest</p>
          <ul className="mt-2 space-y-1.5">
            {hints.map((h) => (
              <li key={h.name}>
                <button
                  type="button"
                  onClick={() => {
                    if (inputRef.current) {
                      inputRef.current.value = h.name;
                      inputRef.current.focus();
                    }
                  }}
                  className="w-full text-left text-sm text-ink hover:text-gold"
                >
                  <span className="font-medium">{h.name}</span>
                  <span className="text-ink-soft"> — {h.note}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
