<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Amir & Yasmin wedding site

A separate project from Azure & Lauren's site. Never share code-level state, databases, env vars, or Vercel projects between the two.

- Five events, one config: `src/lib/events.ts` is the single source of truth (names, dates, times, photos). Pages, RSVP form, dashboard and CSV all read from it.
- All guest reads/writes go through `src/lib/store.ts`. Today it's an in-memory preview store seeded from `src/lib/demoData.ts` (`DEMO_MODE` on by default). Moving to a real database = reimplementing that one module.

<!-- BEGIN:data-safety-rules -->
# DATA SAFETY — read before any data-layer change

Once real guests are loaded, the guest list is irreplaceable. These rules apply to anyone — human or agent — editing this repo:

1. **No unbounded bulk deletes.** Deleting is per-guest (or one primary + their household) only. Never add a "delete all" / "reset" action.
2. **CSV import is merge-only.** Never add a "replace" mode.
3. **When a real database is added**: never write a migration containing `DROP TABLE`, `TRUNCATE`, `DELETE FROM` without `WHERE`, or `DROP COLUMN` without explicit confirmation from the user; never run `prisma migrate reset` / `db push --force-reset` against anything that may be prod; carry over the runtime delete guard and migration scanner used on the Azure & Lauren project.
4. Seeding must refuse to run if guests already exist.
<!-- END:data-safety-rules -->
