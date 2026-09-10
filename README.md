# Heartland JA — Digital Publishing Platform

The magazine, news service and business directory for the parish of Clarendon,
Jamaica.

Client: Ventley Brown, trading as Heartland JA.
Built by Quantum Era Solutions.

---

## Running it

**No backend is required.** With no Supabase credentials configured, the
application serves development seed data — every page renders, the directory is
browsable, and the admin and owner portals can be demonstrated.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

To sign in as a role (development only), visit **http://localhost:3000/dev/login**.
This route does not exist in production and is disabled the moment real Supabase
auth is configured.

## Connecting a backend

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in the three Supabase values.
3. Apply the migrations in `supabase/migrations/` in order.
4. Set `NEXT_PUBLIC_AUTH_MODE=supabase`.
5. Set `ANALYTICS_SALT` to a long random string (`openssl rand -hex 32`).

Nothing else changes. The data layer switches from seed files to Postgres
automatically.

## How it is put together

| Path | What it is |
|---|---|
| `src/lib/data/` | Data access. Every reader falls back to seed data when Supabase is absent — this is the seam that lets the app run backendless. |
| `src/lib/auth/` | Authentication. The only file that changes when real auth lands. |
| `src/lib/seo/` | Metadata, JSON-LD and sitemap builders. Used by every route. |
| `src/lib/analytics/` | Listing event tracking — the revenue-layer measurement. |
| `src/lib/payments/` | Offline payments. The isolated integration point for a future processor. |
| `supabase/migrations/` | Schema and every RLS policy. |
| `DESIGN.md` | The design standard this interface is audited against. |

### Architectural notes

**SEO is the business model, not a feature.** Every news page is a permanent
indexable asset whose accumulated authority raises the value of every directory
listing. Metadata, structured data and sitemaps were built in Phase 1, before
any content existed, because retrofitting them is how sites end up with
duplicate URLs and thin pages.

**Everything content-bearing is server-rendered.** Contact links on a listing are
real `<a href>` elements — `tel:`, `wa.me`, Google Maps — that work with
JavaScript disabled. Tracking is layered on top of a working link, never in
place of one.

**Business isolation is enforced in the database.** The RLS policy on
`listing_events` permits inserts from anyone but restricts reads to the owning
business and admin, and the metrics RPCs are `SECURITY DEFINER` with an explicit
ownership check inside. An owner cannot see another business's numbers even if
application code forgot to check.

**No third-party scripts anywhere.** No embeds, no tag managers, no font CDN, no
analytics vendor. A listing page is 203KB gzipped against a 500KB budget.

## Commands

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
npx tsc --noEmit # typecheck
```

## Status

- **Phase 1 — Foundation.** Complete.
- **Phase 2 — Directory (the sellable milestone).** Complete.
- **Phase 3 — News engine and history.** Not started.
- **Phase 4 — Magazine.** Not started.
- **Phase 5 — Podcast, live stream, newsletter, ads.** Not started.
- **Phase 6 — Hardening.** Not started.

See `PHASE-NOTES.md` for what was built, what was decided, and every assumption
that needs the client's confirmation.
