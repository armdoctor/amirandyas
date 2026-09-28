"use client";

import { useState, useTransition } from "react";
import { submitRsvp } from "@/app/actions/rsvp";
import { EVENTS, EVENT_KEYS, type EventKey } from "@/lib/events";
import type { MemberRow } from "@/lib/household";
import type { Attendance } from "@/lib/types";

type Props = {
  primaryId: string;
  members: MemberRow[];
  initialMessage: string;
  notePrompt: string;
  demo: boolean;
};

type MemberState = {
  guestId: string;
  attending: Attendance;
  dietaryRestrictions: string;
  plusOneAttending: boolean | null;
  plusOneName: string;
  plusOneDietary: string;
};

function init(m: MemberRow): MemberState {
  return {
    guestId: m.id,
    attending: { ...m.attending },
    dietaryRestrictions: m.dietaryRestrictions ?? "",
    plusOneAttending: m.plusOneAttending,
    plusOneName: m.plusOneName ?? "",
    plusOneDietary: m.plusOneDietary ?? "",
  };
}

const inputClass =
  "mt-2 w-full rounded-sm border border-sand-300 bg-white px-3 py-2.5 text-base text-ink placeholder:text-ink-soft/50 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink/30";
const fieldLabel = "block text-[11px] uppercase tracking-[0.2em] text-ink-soft";

export function RsvpForm({ primaryId, members, initialMessage, notePrompt, demo }: Props) {
  const [states, setStates] = useState<MemberState[]>(() => members.map(init));
  const [message, setMessage] = useState(initialMessage);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: true } | { ok: false; error: string } | null>(null);

  const isSolo = members.length === 1;
  const solo = isSolo ? members[0] : null;
  const showPlusOne = !!solo?.plusOneAllowed;

  function patch(idx: number, p: Partial<MemberState>) {
    setStates((prev) => prev.map((s, i) => (i === idx ? { ...s, ...p } : s)));
  }
  function setAttending(idx: number, key: EventKey, v: boolean) {
    setStates((prev) => prev.map((s, i) => (i === idx ? { ...s, attending: { ...s.attending, [key]: v } } : s)));
  }
  function setAll(idx: number, v: boolean) {
    const m = members[idx];
    const next: Attendance = {};
    for (const k of m.invitedTo) next[k] = v;
    patch(idx, { attending: next });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const unanswered = states.some((s, i) => members[i].invitedTo.some((k) => s.attending[k] == null));
    if (unanswered) {
      setResult({ ok: false, error: "Please answer yes or no for every celebration listed." });
      return;
    }
    if (!message.trim()) {
      setResult({ ok: false, error: "Please answer the question above." });
      return;
    }
    if (showPlusOne && states[0].plusOneAttending === true && !states[0].plusOneName.trim()) {
      setResult({ ok: false, error: "Please add your plus one's name." });
      return;
    }
    startTransition(async () => {
      const r = await submitRsvp({
        members: states.map((s) => ({
          guestId: s.guestId,
          attending: s.attending,
          dietaryRestrictions: s.dietaryRestrictions,
          plusOneAttending: s.plusOneAttending,
          plusOneName: s.plusOneName,
          plusOneDietary: s.plusOneDietary,
        })),
        message,
      });
      setResult(r);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {members.map((m, idx) => {
        const s = states[idx];
        const keys = EVENT_KEYS.filter((k) => m.invitedTo.includes(k));
        return (
          <fieldset key={m.id} className="space-y-5 rounded-sm border border-sand-300 bg-sand-50 p-5 sm:p-6">
            <legend className="-mb-2 inline-flex items-baseline gap-2 px-2 font-serif text-2xl text-ink">
              {members.length > 1 ? m.firstName : m.fullName}
              {m.id === primaryId && members.length > 1 && (
                <span className="text-[10px] uppercase tracking-[0.25em] text-ink-soft">· you</span>
              )}
            </legend>

            {keys.length > 1 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.2em] text-ink-soft">
                <span>Quick fill:</span>
                <button type="button" onClick={() => setAll(idx, true)} className="underline decoration-sand-400 underline-offset-4 hover:text-ink">
                  Yes to all
                </button>
                <button type="button" onClick={() => setAll(idx, false)} className="underline decoration-sand-400 underline-offset-4 hover:text-ink">
                  Can&rsquo;t make any
                </button>
              </div>
            )}

            <div className="divide-y divide-sand-200">
              {keys.map((k) => (
                <YesNoRow
                  key={k}
                  title={EVENTS[k].name}
                  sub={`${EVENTS[k].dateShort} · ${EVENTS[k].timeLabel}`}
                  value={s.attending[k] ?? null}
                  onChange={(v) => setAttending(idx, k, v)}
                />
              ))}
            </div>

            <div>
              <label className={fieldLabel}>Dietary restrictions or food allergies</label>
              <input
                type="text"
                value={s.dietaryRestrictions}
                onChange={(e) => patch(idx, { dietaryRestrictions: e.target.value })}
                placeholder="e.g. vegetarian, no shellfish"
                className={inputClass}
              />
            </div>
          </fieldset>
        );
      })}

      {showPlusOne && (
        <fieldset className="space-y-5 rounded-sm border border-sand-300 bg-sand-50 p-5 sm:p-6">
          <legend className="-mb-2 px-2 font-serif text-2xl text-ink">Plus one</legend>
          <YesNoRow
            title="Will you be bringing a plus one?"
            sub="They'll join you at the celebrations you're attending."
            value={states[0].plusOneAttending}
            onChange={(v) => patch(0, { plusOneAttending: v })}
          />
          {states[0].plusOneAttending === true && (
            <div className="space-y-4">
              <div>
                <label className={fieldLabel}>Plus one&rsquo;s full name</label>
                <input
                  type="text"
                  value={states[0].plusOneName}
                  onChange={(e) => patch(0, { plusOneName: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={fieldLabel}>Plus one&rsquo;s dietary restrictions</label>
                <input
                  type="text"
                  value={states[0].plusOneDietary}
                  onChange={(e) => patch(0, { plusOneDietary: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </fieldset>
      )}

      <div className="space-y-3 rounded-sm border border-sand-300 bg-sand-50 p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold">One question for you</p>
        <p className="font-serif text-xl italic leading-snug text-ink">{notePrompt}</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className={inputClass}
          placeholder="Your answer…"
        />
      </div>

      {result?.ok === false && (
        <p role="alert" className="rounded-sm border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
          {result.error}
        </p>
      )}
      {result?.ok === true && (
        <p role="status" className="rounded-sm border border-sand-300 bg-white px-4 py-3 text-center font-serif text-lg text-ink">
          Thank you — your RSVP has been recorded. You can return any time to update it.
          {demo && <span className="mt-1 block text-xs font-sans text-ink-soft">(Preview mode: responses aren&rsquo;t kept permanently.)</span>}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-ink px-4 py-3.5 text-xs font-medium uppercase tracking-[0.3em] text-sand-50 transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending…" : members.some((m) => m.hasResponded) || result?.ok ? "Update RSVP" : "Send RSVP"}
      </button>
    </form>
  );
}

function YesNoRow({
  title,
  sub,
  value,
  onChange,
}: {
  title: string;
  sub?: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  const btn = (active: boolean) =>
    `min-w-[76px] rounded-sm border px-3 py-2 text-[11px] uppercase tracking-[0.2em] transition ${
      active ? "border-ink bg-ink text-sand-50" : "border-sand-300 bg-white text-ink-soft hover:border-ink"
    }`;
  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-serif text-lg leading-tight text-ink">{title}</p>
        {sub && <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>}
      </div>
      <div className="flex gap-2" role="group" aria-label={title}>
        <button type="button" aria-pressed={value === true} onClick={() => onChange(true)} className={btn(value === true)}>
          Joyfully yes
        </button>
        <button type="button" aria-pressed={value === false} onClick={() => onChange(false)} className={btn(value === false)}>
          Sadly no
        </button>
      </div>
    </div>
  );
}
