import { groupByDay, EVENT_KEYS } from "@/lib/events";
import type { Stats } from "@/lib/stats";

export function StatCards({ stats }: { stats: Stats }) {
  const pct = stats.total === 0 ? 0 : Math.round((stats.responded / stats.total) * 100);
  const days = groupByDay(EVENT_KEYS);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Total guests" value={stats.total} sub={`${stats.households} invitations`} />
        <Tile label="Responded" value={stats.responded} sub={`${pct}% of ${stats.total}`} />
        <Tile label="Awaiting reply" value={stats.total - stats.responded} />
        <Tile label="Plus-ones coming" value={stats.plusOnesYes} />
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {days.map((day) => (
          <div key={day.dateISO} className="rounded-lg border border-neutral-200 bg-white">
            <p className="border-b border-neutral-100 px-4 py-2 text-xs font-medium text-neutral-500">{day.dateLabel}</p>
            <div className="divide-y divide-neutral-100">
              {day.events.map((e) => {
                const s = stats.events[e.key];
                return (
                  <div key={e.key} className="px-4 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-neutral-900">{e.name}</p>
                      <p className="shrink-0 text-xs text-neutral-500">{e.timeLabel}</p>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      <span className="text-lg font-semibold tabular-nums text-neutral-900">{s.yes + s.plusOnes}</span>{" "}
                      coming{s.plusOnes > 0 && ` (incl. ${s.plusOnes} plus-one${s.plusOnes === 1 ? "" : "s"})`} · {s.no} no ·{" "}
                      {s.pending} pending · {s.invited} invited
                    </p>
                    <SegmentedBar yes={s.yes} no={s.no} pending={s.pending} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

function SegmentedBar({ yes, no, pending }: { yes: number; no: number; pending: number }) {
  const total = Math.max(yes + no + pending, 1);
  return (
    <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
      <div className="bg-green-500" style={{ width: `${(yes / total) * 100}%` }} />
      <div className="bg-red-400" style={{ width: `${(no / total) * 100}%` }} />
    </div>
  );
}
