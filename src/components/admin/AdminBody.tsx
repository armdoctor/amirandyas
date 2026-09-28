"use client";

import { useState } from "react";
import type { Guest } from "@/lib/types";
import type { Stats } from "@/lib/stats";
import { StatCards } from "@/components/admin/StatCards";
import { GuestList } from "@/components/admin/GuestList";
import { AddGuestPanel } from "@/components/admin/AddGuestPanel";

export function AdminBody({ guests, stats }: { guests: Guest[]; stats: Stats }) {
  const [adding, setAdding] = useState(false);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Guests</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {stats.total} on the list · {stats.households} invitations · {stats.responded} replied
            {stats.plusOnesYes > 0 && ` · ${stats.plusOnesYes} plus-one${stats.plusOnesYes === 1 ? "" : "s"} coming`}
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            + Add guest
          </button>
        )}
      </header>

      <div className="mt-6">
        <StatCards stats={stats} />
      </div>

      {adding && (
        <div className="mt-6">
          <AddGuestPanel onClose={() => setAdding(false)} />
        </div>
      )}

      <section className="mt-8">
        <GuestList guests={guests} />
      </section>
    </>
  );
}
