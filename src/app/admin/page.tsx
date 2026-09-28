import { adminLogout } from "@/app/actions/admin-auth";
import { listGuests } from "@/lib/store";
import { computeStats } from "@/lib/stats";
import { DEMO_MODE } from "@/lib/config";
import { AdminBody } from "@/components/admin/AdminBody";
import { CsvImportPopover } from "@/components/admin/CsvImportPopover";
import { Brand } from "@/components/admin/Brand";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const guests = await listGuests();
  const stats = computeStats(guests);

  return (
    <div className="min-h-svh bg-neutral-50 text-base text-neutral-900">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
          <Brand />
          <div className="flex items-center gap-2">
            <CsvImportPopover />
            <a
              href="/api/admin/export"
              className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Export CSV
            </a>
            <form action={adminLogout}>
              <button
                type="submit"
                className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {DEMO_MODE && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
          Preview mode — these are sample guests, and changes may reset at any time.
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <AdminBody guests={guests} stats={stats} />
      </main>
    </div>
  );
}
