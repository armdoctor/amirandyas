"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { addGuest } from "@/app/actions/guest-admin";
import { EVENT_LIST, EVENT_KEYS, type EventKey } from "@/lib/events";

type MemberForm = { key: string; firstName: string; lastName: string; invitedTo: EventKey[] };

const blank = () => ({ firstName: "", lastName: "", invitedTo: [] as EventKey[], plusOneAllowed: false });

function toggle(list: EventKey[], k: EventKey, on: boolean) {
  const set = new Set(list);
  if (on) set.add(k);
  else set.delete(k);
  return EVENT_KEYS.filter((x) => set.has(x));
}

const inputClass =
  "block w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900";

export function AddGuestPanel({ onClose }: { onClose: () => void }) {
  const [primary, setPrimary] = useState(blank());
  const [members, setMembers] = useState<MemberForm[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const firstRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => firstRef.current?.focus(), []);

  const isFamily = members.length > 0;

  function submit(closeAfter: boolean) {
    setError(null);
    if (!primary.firstName.trim() || !primary.lastName.trim()) return setError("Enter the primary guest's first and last name.");
    if (primary.invitedTo.length === 0) return setError("Pick at least one event.");
    const clean = members.filter((m) => m.firstName.trim() && m.lastName.trim());
    startTransition(async () => {
      const r = await addGuest({
        firstName: primary.firstName,
        lastName: primary.lastName,
        invitedTo: primary.invitedTo,
        plusOneAllowed: primary.plusOneAllowed && !isFamily,
        members: clean.map(({ firstName, lastName, invitedTo }) => ({ firstName, lastName, invitedTo })),
      });
      if (!r.ok) return setError(r.error);
      if (closeAfter) onClose();
      else {
        setPrimary(blank());
        setMembers([]);
        firstRef.current?.focus();
      }
    });
  }

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          submit(true);
        }
      }}
      className="rounded-lg border border-neutral-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5">
        <h3 className="text-sm font-medium text-neutral-900">Add an invitation</h3>
        <button onClick={onClose} className="text-xs text-neutral-500 hover:text-neutral-900">
          Cancel
        </button>
      </div>

      <div className="space-y-5 p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs font-medium text-neutral-600">First name</span>
            <input
              ref={firstRef}
              value={primary.firstName}
              onChange={(e) => setPrimary({ ...primary, firstName: e.target.value })}
              className={`mt-1 ${inputClass}`}
              placeholder="e.g. Nurul"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-neutral-600">Last name</span>
            <input
              value={primary.lastName}
              onChange={(e) => setPrimary({ ...primary, lastName: e.target.value })}
              className={`mt-1 ${inputClass}`}
              placeholder="e.g. Hassan"
            />
          </label>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-neutral-600">Invited to</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EVENT_LIST.map((e) => (
              <Check
                key={e.key}
                label={`${e.name} · ${e.dateShort}`}
                checked={primary.invitedTo.includes(e.key)}
                onChange={(v) => setPrimary({ ...primary, invitedTo: toggle(primary.invitedTo, e.key, v) })}
              />
            ))}
          </div>
          <div className="mt-3">
            <Check
              label="Plus-one allowed"
              checked={primary.plusOneAllowed && !isFamily}
              disabled={isFamily}
              hint={isFamily ? "Households don't get a plus-one" : undefined}
              onChange={(v) => setPrimary({ ...primary, plusOneAllowed: v })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Household members ({members.length})</p>
          {members.map((m) => (
            <div key={m.key} className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/60 p-3">
              <div className="flex gap-2">
                <input
                  value={m.firstName}
                  onChange={(e) => setMembers((a) => a.map((x) => (x.key === m.key ? { ...x, firstName: e.target.value } : x)))}
                  placeholder="First name"
                  className={inputClass}
                />
                <input
                  value={m.lastName}
                  onChange={(e) => setMembers((a) => a.map((x) => (x.key === m.key ? { ...x, lastName: e.target.value } : x)))}
                  placeholder="Last name"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setMembers((a) => a.filter((x) => x.key !== m.key))}
                  aria-label="Remove member"
                  className="px-1 text-neutral-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {EVENT_LIST.map((e) => (
                  <Check
                    key={e.key}
                    small
                    label={e.shortName}
                    checked={m.invitedTo.includes(e.key)}
                    onChange={(v) =>
                      setMembers((a) => a.map((x) => (x.key === m.key ? { ...x, invitedTo: toggle(x.invitedTo, e.key, v) } : x)))
                    }
                  />
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setMembers((m) => [
                ...m,
                { key: crypto.randomUUID(), firstName: "", lastName: primary.lastName, invitedTo: [...primary.invitedTo] },
              ])
            }
            className="rounded-md border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            + Add household member
          </button>
        </div>

        {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-2.5">
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={pending}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
        >
          Save &amp; add another
        </button>
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={pending}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-300"
        >
          {pending ? "Saving…" : "Save invitation"}
        </button>
      </div>
    </div>
  );
}

export function Check({
  label,
  checked,
  onChange,
  disabled = false,
  hint,
  small = false,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  hint?: string;
  small?: boolean;
}) {
  return (
    <label className={`inline-flex items-center gap-2 ${disabled ? "opacity-50" : "cursor-pointer"}`} title={hint}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-neutral-300 accent-neutral-900"
      />
      <span className={`${small ? "text-xs" : "text-sm"} text-neutral-700`}>{label}</span>
    </label>
  );
}
