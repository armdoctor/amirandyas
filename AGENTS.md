<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Amir & Yasmin wedding site

A separate project from Azure & Lauren's site. Never share databases, env vars, Vercel projects or code-level state between the two.

- Five events, one config: `src/lib/events.ts` is the single source of truth (names, dates, times, photos).
- Guests live in Amir & Yasmin's OWN Neon Postgres (`amirandyasmin-guests`, connected only to the `amirandyas` Vercel project). Prisma schema: `prisma/schema.prisma`.
- All guest reads/writes go through `src/lib/store.ts` → `storePrisma.ts`. `storeMemory.ts` is only used when `DEMO_MODE="1"` is set explicitly. There is no silent fallback to memory.

# DATA SAFETY — read before ANY data-layer change

The guest list and RSVPs are irreplaceable. Losing them means the couple re-entering everything and, worst of all, guests having to RSVP again. MUST AVOID.

Protections in place (do not remove or weaken any of them):

1. **Database-level safety net** (`prisma/migrations/*_safety_net`): every insert/update/delete on `Guest` is copied into `AuditLog` by a trigger; `AuditLog` is append-only; `TRUNCATE` is refused on both tables; one statement can't delete >25 or update >50 guests.
2. **App-level guards** (`src/lib/db.ts`): no `Guest.deleteMany`/`updateMany` without a `where`; `AuditLog` can't be updated or deleted.
3. **Delete = one invitation at a time**, snapshotted first, restorable from the dashboard ("Recently deleted"). Never add a "delete all" / "reset" action.
4. **CSV import is merge-only.** Never add a "replace" mode.
5. **Migration scanner** (`scripts/check-destructive-migrations.mjs`) runs in `npm run build` and CI and blocks `DROP TABLE/COLUMN/TRIGGER/FUNCTION`, `TRUNCATE`, `DISABLE TRIGGER`, `DELETE FROM` without `WHERE`. Bypass marker `-- ALLOW_DESTRUCTIVE_MIGRATION: <reason>` only after the user explicitly confirms the data loss is intended.
6. **Preview deployments get their own Neon branch** (set in the Vercel ⇄ Neon integration), so tinkering on a branch never touches production data.
7. **Daily backup** via `.github/workflows/db-backup.yml` (needs the repo secret `DATABASE_URL`).

Never:
- run `prisma migrate reset`, `prisma db push`, or `prisma db push --force-reset` against this database;
- rename a Prisma field directly (Prisma turns it into DROP + ADD = data loss) — write a manual `ALTER TABLE … RENAME COLUMN` migration;
- point `DATABASE_URL` at Azure & Lauren's database, or this one at theirs;
- tinker locally against production — create a Neon branch and use its URL.

Recovering data: every change is in `AuditLog` (`before`/`after` JSON). Deleted invitations can be restored from the dashboard. Neon also keeps point-in-time history for its restore window.
