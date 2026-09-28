"use client";

import { useMemo, useState } from "react";
import type { Guest } from "@/lib/types";
import { EVENT_LIST, type EventKey } from "@/lib/events";
import { EditGuestDrawer } from "@/components/admin/EditGuestDrawer";

type FilterStatus = "all" | "responded" | "pending";
type SortKey = "name" | "household" | "responded";

export function GuestList({ guests }: { guests: Guest[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<FilterStatus>("all");
  const [event, setEvent] = useState<"all" | EventKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("household");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const byId = useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);
  const householdName = (g: Guest) => (g.primaryGuestId ? byId.get(g.primaryGuestId)?.fullName ?? "" : g.fullName);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = guests.filter((g) => {
      if (needle && !`${g.fullName} ${householdName(g)}`.toLowerCase().includes(needle)) return false;
      if (status === "responded" && !g.hasResponded) return false;
      if (status === "pending" && g.hasResponded) return false;
      if (event !== "all" && !g.invitedTo.includes(event)) return false;
      return true;
    });
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.fullName.localeCompare(b.fullName);
      else if (sortKey === "household")
        cmp =
          householdName(a).localeCompare(householdName(b)) ||
          Number(!!a.primaryGuestId) - Number(!!b.primaryGuestId) ||
          a.fullName.localeCompare(b.fullName);
      else cmp = Number(a.hasResponded) - Number(b.hasResponded);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guests, q, status, event, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const editingGuest = editing ? byId.get(editing) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search guests or household"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 lg:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          <SegGroup
            value={status}
            onChange={setStatus}
            options={[
              { v: "all", l: "All" },
              { v: "responded", l: "Responded" },
              { v: "pending", l: "Pending" },
            ]}
          />
          <select
            value={event}
            onChange={(e) => setEvent(e.target.value as "all" | EventKey)}
            className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700"
            aria-label="Filter by event"
          >
            <option value="all">All events</option>
            {EVENT_LIST.map((e) => (
              <option key={e.key} value={e.key}>
                {e.name} · {e.dateShort}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <SortableTh label="Name" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
              <SortableTh label="Invite" active={sortKey === "household"} dir={sortDir} onClick={() => toggleSort("household")} />
              {EVENT_LIST.map((e) => (
                <th key={e.key} className="whitespace-nowrap px-3 py-2 font-medium" title={`${e.name} · ${e.dateShort}`}>
                  {e.shortName}
                  <span className="block text-[10px] font-normal normal-case text-neutral-400">{e.dateShort}</span>
                </th>
              ))}
              <th className="px-3 py-2 font-medium">Plus one</th>
              <th className="px-3 py-2 font-medium">Dietary</th>
              <SortableTh
                label="Status"
                active={sortKey === "responded"}
                dir={sortDir}
                onClick={() => toggleSort("responded")}
                className="text-right"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map((g) => (
              <tr key={g.id} onClick={() => setEditing(g.id)} className="cursor-pointer hover:bg-neutral-50">
                <td className="whitespace-nowrap px-3 py-2.5">
                  <span className={`font-medium text-neutral-900 ${g.primaryGuestId ? "pl-3" : ""}`}>
                    {g.primaryGuestId && <span className="mr-1 text-neutral-300">↳</span>}
                    {g.fullName}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-neutral-600">
                  {g.primaryGuestId ? householdName(g) : <span className="text-xs text-neutral-400">Primary</span>}
                </td>
                {EVENT_LIST.map((e) => (
                  <td
                    key={e.key}
                    className={`whitespace-nowrap px-3 py-2.5 ${g.invitedTo.includes(e.key) ? "" : "bg-neutral-50/80"}`}
                  >
                    {g.invitedTo.includes(e.key) && (
                      <StatusBadge attending={g.attending[e.key] ?? null} responded={g.hasResponded} />
                    )}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-2.5 text-neutral-600">
                  {!g.plusOneAllowed ? (
                    <span className="text-xs text-neutral-200">·</span>
                  ) : g.plusOneAttending === true ? (
                    <span className="text-neutral-900">{g.plusOneName || "Yes"}</span>
                  ) : g.plusOneAttending === false ? (
                    <span className="text-neutral-500">Declined</span>
                  ) : (
                    <span className="text-neutral-400">Allowed</span>
                  )}
                </td>
                <td className="max-w-[180px] truncate px-3 py-2.5 text-neutral-600">
                  {g.dietaryRestrictions || <span className="text-neutral-300">—</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                  {g.hasResponded ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Replied
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                      Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={EVENT_LIST.length + 5} className="px-3 py-10 text-center text-sm text-neutral-500">
                  No guests match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-right text-xs text-neutral-500">
        {filtered.length} of {guests.length} · <span className="text-neutral-400">shaded = not invited</span>
      </p>

      {editingGuest && (
        <EditGuestDrawer
          key={editingGuest.id}
          guest={editingGuest}
          inviteSize={
            1 + guests.filter((x) => x.primaryGuestId === (editingGuest.primaryGuestId ?? editingGuest.id)).length
          }
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function StatusBadge({ attending, responded }: { attending: boolean | null; responded: boolean }) {
  if (!responded || attending === null) return <span className="text-xs text-neutral-400">Invited</span>;
  return attending ? (
    <span className="inline-flex rounded bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700">Yes</span>
  ) : (
    <span className="inline-flex rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700">No</span>
  );
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
  className = "",
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={`px-3 py-2 font-medium ${className}`}>
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-neutral-900">
        {label}
        <span className="text-neutral-400">{active ? (dir === "asc" ? "↑" : "↓") : ""}</span>
      </button>
    </th>
  );
}

function SegGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { v: T; l: string }[];
}) {
  return (
    <div className="inline-flex rounded-md border border-neutral-200 bg-white p-0.5">
      {options.map((opt) => (
        <button
          key={opt.v}
          type="button"
          onClick={() => onChange(opt.v)}
          className={`rounded px-2.5 py-1 text-xs font-medium transition ${
            opt.v === value ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          {opt.l}
        </button>
      ))}
    </div>
  );
}
