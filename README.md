# Amir & Yasmin — wedding RSVP site

Next.js 16 (App Router) + Tailwind 4. Guests sign in with their full name, see only the celebrations they're invited to, and RSVP for their whole household. The couple manage everything from `/admin`.

## The five celebrations (all at Waterfall, Furama RiverFront)

| Event | Date | Time | Seated by |
|---|---|---|---|
| Solemnisation (Nikah) | Sat 13 Mar 2027 | 9:00–10:00 am | 9:00 am |
| Yasmin's Family Reception | Sat 13 Mar 2027 | 11:00 am–1:00 pm | 11:30 am |
| Yasmin's Friends Reception | Sat 13 Mar 2027 | 2:00–4:00 pm | 2:30 pm |
| Amir's Friends Reception | Sun 14 Mar 2027 | 2:00–4:00 pm | 2:30 pm |
| Amir's Family Reception | Mon 15 Mar 2027 | 11:00 am–1:00 pm | 11:30 am |

Edit any of these in `src/lib/events.ts`.

## Data

Guests and RSVPs live in Amir & Yasmin's own Neon Postgres database (`amirandyasmin-guests`), connected only to the `amirandyas` Vercel project. Migrations run automatically on deploy. See `AGENTS.md` for the safety net that protects the data.

Required env vars on Vercel: `DATABASE_URL` (+ `DATABASE_URL_UNPOOLED`, both set by the Neon integration), `SESSION_SECRET`, `ADMIN_PASSWORD`.

## Preview mode (no database)

Set `DEMO_MODE="1"` to run with in-memory sample guests (nothing saved) — for local design work only.

## Run locally

```bash
npm install
# .env: DATABASE_URL pointing at a Neon BRANCH of the database (never main), SESSION_SECRET, ADMIN_PASSWORD
npm run dev
```

## Deploy

Push to `main` on GitHub (`armdoctor/amirandyas`); Vercel builds and deploys automatically. The build refuses to deploy if a migration contains destructive SQL.
