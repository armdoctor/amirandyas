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

## Preview mode (current)

`DEMO_MODE` is on unless set to `"0"`. The site runs with sample guests held in memory — **nothing is saved permanently** and data can reset whenever Vercel spins up a fresh server. No environment variables are required.

Sample guests to try: Rashid Hamzah, Aisyah Rahman, Daniel Lim, Hassan Ali, Zulkifli Abdullah (or a household member like Noraini Hamzah to see the "managed by" page).

Dashboard: `/admin` — preview password `amiryasmin2027` (override with `ADMIN_PASSWORD`).

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000
```

## Deploy to Vercel

1. Push this folder to a **new** GitHub repo (e.g. `amirandyasmin`).
2. Vercel → Add New → Project → import that repo. Framework: Next.js. No env vars needed for preview.
3. Optional: set `ADMIN_PASSWORD` and `SESSION_SECRET` in Project → Settings → Environment Variables.

## Going live later

Connect a new, dedicated database (not Azure & Lauren's), reimplement `src/lib/store.ts` against it, set `DEMO_MODE=0`, `SESSION_SECRET` and `ADMIN_PASSWORD`, and load the real guest list via Import CSV on the dashboard. See `AGENTS.md` for the data-safety rules.
