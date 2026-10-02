"use client";

import { useEffect, useState, useTransition } from "react";
import type { Guest } from "@/lib/types";
import { EVENT_LIST, EVENT_KEYS, type EventKey } from "@/lib/events";
import { updateGuest, deleteGuest } from "@/app/actions/guest-admin";
import { pickPromptForId } from "@/lib/notePrompts";
import { Check } from "@/components/admin/AddGuestPanel";

const inputClass =
  "block w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900";

export function EditGuestDrawer({ guest, inviteSize, onClose }: { guest: Guest; inviteSize: number; onClose: () => void }) {
  const [form, setForm] = useState({
    firstName: guest.firstName,
    lastName: guest.lastName,
    invitedTo: guest.invitedTo,
    plusOneAllowed: guest.plusOneAllowed,
    hasResponded: guest.hasResponded,
    attending: guest.attending,
    dietaryRestrictions: guest.dietaryRestrictions ?? "",
    plusOneAttending: guest.plusOneAttending,
    plusOneName: guest.plusOneName ?? "",
    plusOneDietary: guest.plusOneDietary ?? "",
    message: guest.message ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const isPrimary = !guest.primaryGuestId;
  const isSolo = isPrimary && inviteSize === 1;

  function setInvited(k: EventKey, on: boolean) {
    const set = new Set(form.invitedTo);
    if (on) set.add(k);
    else set.delete(k);
    setForm({ ...form, invitedTo: EVENT_KEYS.filter((x) => set.has(x)) });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await updateGuest(guest.id, {
        ...form,
        plusOneAllowed: isSolo ? form.plusOneAllowed : false,
      });
      if (!r.ok) setError(r.error);
      else onClose();
    });
  }

  function doDelete() {
    setError(null);
    startTransition(async () => {
      const r = await deleteGuest(guest.id);
      if (!r.ok) setError(r.error);
      else onClose();
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/30" onClick={onClose} aria-hidden />
      <aside className="fixed right-0 top-0 z-40 flex h-svh w-full max-w-md flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Edit guest</h2>
            <p className="text-xs text-neutral-500">
              {isPrimary ? (isSolo ? "Solo invitation" : `Primary contact for ${inviteSize} people`) : "Part of someone else's invitation"}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100" aria-label="Close">
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
          <Block title="Name">
            <div className="grid grid-cols-2 gap-3">
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} />
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} />
            </div>
          </Block>

          <Block title="Invited to">
            <div className="space-y-2">
              {EVENT_LIST.map((e) => (
                <div key={e.key}>
                  <Check label={`${e.name} · ${e.dateShort}`} checked={form.invitedTo.includes(e.key)} onChange={(v) => setInvited(e.key, v)} />
                </div>
              ))}
              <div className="pt-1">
                <Check
                  label="Plus-one allowed"
                  checked={isSolo && form.plusOneAllowed}
                  disabled={!isSolo}
                  hint={!isSolo ? "Only solo invitations can have a plus-one" : undefined}
                  onChange={(v) => setForm({ ...form, plusOneAllowed: v })}
                />
              </div>
            </div>
          </Block>

          <Block title="RSVP">
            <div className="space-y-3">
              <Check label="Marked as responded" checked={form.hasResponded} onChange={(v) => setForm({ ...form, hasResponded: v })} />
              {EVENT_LIST.filter((e) => form.invitedTo.includes(e.key)).map((e) => (
                <Tristate
                  key={e.key}
                  label={e.name}
                  value={form.attending[e.key] ?? null}
                  onChange={(v) => setForm({ ...form, attending: { ...form.attending, [e.key]: v } })}
                />
              ))}
              <label className="block">
                <span className="block text-xs font-medium text-neutral-600">Dietary restrictions</span>
                <input
                  value={form.dietaryRestrictions}
                  onChange={(e) => setForm({ ...form, dietaryRestrictions: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                />
              </label>
            </div>
          </Block>

          {isSolo && form.plusOneAllowed && (
            <Block title="Plus-one">
              <Tristate label="Plus-one attending" value={form.plusOneAttending} onChange={(v) => setForm({ ...form, plusOneAttending: v })} />
              <div className="mt-3 space-y-3">
                <input placeholder="Name" value={form.plusOneName} onChange={(e) => setForm({ ...form, plusOneName: e.target.value })} className={inputClass} />
                <input placeholder="Dietary" value={form.plusOneDietary} onChange={(e) => setForm({ ...form, plusOneDietary: e.target.value })} className={inputClass} />
              </div>
            </Block>
          )}

          {isPrimary && (
            <Block title="Their answer">
              <p className="mb-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs italic text-neutral-700">{pickPromptForId(guest.id)}</p>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className={inputClass} />
            </Block>
          )}

          {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <footer className="border-t border-neutral-200 px-5 py-3">
          {confirmDelete ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-neutral-700">
                Delete <span className="font-medium text-neutral-900">{guest.fullName}</span>
                {isPrimary && inviteSize > 1 ? ` and ${inviteSize - 1} household member${inviteSize - 1 === 1 ? "" : "s"}?` : "?"}
                {guest.hasResponded && (
                  <span className="mt-1 block text-xs text-amber-700">
                    They&rsquo;ve already RSVP&rsquo;d. You can undo this from &ldquo;Recently deleted&rdquo; below the guest list.
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700">
                  Cancel
                </button>
                <button onClick={doDelete} disabled={pending} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:bg-red-300">
                  {pending ? "Deleting…" : "Confirm delete"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => setConfirmDelete(true)} className="text-sm font-medium text-red-600 hover:text-red-700">
                {isPrimary && inviteSize > 1 ? `Delete invitation (${inviteSize})` : "Delete guest"}
              </button>
              <div className="flex gap-2">
                <button onClick={onClose} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                  Cancel
                </button>
                <button onClick={save} disabled={pending} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-300">
                  {pending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          )}
        </footer>
      </aside>
    </>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">{title}</p>
      {children}
    </div>
  );
}

function Tristate({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean | null) => void }) {
  const opts: { v: boolean | null; l: string }[] = [
    { v: true, l: "Yes" },
    { v: false, l: "No" },
    { v: null, l: "—" },
  ];
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-neutral-700">{label}</span>
      <div className="flex gap-1.5">
        {opts.map((o) => (
          <button
            key={o.l}
            type="button"
            onClick={() => onChange(o.v)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
              o.v === value ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}
