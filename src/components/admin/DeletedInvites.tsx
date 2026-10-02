"use client";

import { useState, useTransition } from "react";
import { restoreInvite } from "@/app/actions/guest-admin";
import type { DeletedInvite } from "@/lib/storeTypes";

export function DeletedInvites({ items }: { items: DeletedInvite[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  if (items.length === 0) return null;

  return (
    <details className="rounded-lg border border-neutral-200 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-neutral-700">
        Recently deleted ({items.length}) — restore anything removed by mistake
      </summary>
      <div className="divide-y divide-neutral-100 border-t border-neutral-100">
        {items.map((d) => (
          <div key={d.logId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <div>
              <p className="font-medium text-neutral-900">{d.people.join(", ")}</p>
              <p className="text-xs text-neutral-500">
                Deleted {new Date(d.deletedAt).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" })}
                {d.hadResponded && " · had already RSVP'd — restoring brings their answers back"}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setMsg(null);
                  const r = await restoreInvite(d.logId);
                  setMsg(r.ok ? `Restored ${d.primaryName}.` : r.error);
                })
              }
              className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            >
              Restore
            </button>
          </div>
        ))}
      </div>
      {msg && <p className="border-t border-neutral-100 px-4 py-2 text-xs text-neutral-600">{msg}</p>}
    </details>
  );
}
