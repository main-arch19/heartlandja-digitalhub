# Phase Notes

What was built, what was decided, and what needs the client's confirmation.

---

# Phases 1 & 2 — Foundation and Directory

**Status: complete and verified.** The directory is demonstrable on real
pages — the client can show a prospective advertiser exactly how a listing will
appear and exactly what it will report back.

## What was built

### Phase 1 — Foundation

- Next.js 16 (App Router, TypeScript strict, server components by default),
  Tailwind v4, deployed-ready for Vercel.
- Full Postgres schema — 18 tables covering content, directory, advertising and
  platform — with **Row Level Security on every table**.
- Role model: `admin`, `editor`, `contributor`, `business_owner`.
- Auth module with a stubbed-but-real shape. Route guards, role checks and a
  403 page all work now; switching to Supabase Auth is a change inside
  `src/lib/auth/index.ts` and nowhere else.
- Data-access layer with seed fallback — the app runs and demonstrates with no
  backend at all.
- Design system: deep green, warm cream, gold accent. Self-hosted variable
  fonts. Documented in `DESIGN.md`.
- SEO foundation built here, not later: metadata builders with editor
  overrides, JSON-LD builders, split sitemaps with an index, robots.txt,
  generated OG images.
- Security headers including a strict CSP that permits no third-party scripts.

### Phase 2 — Directory

- Category pages, town pages, listing pages, directory home with search.
- All four route levels carry `BreadcrumbList`; every listing carries
  `LocalBusiness` with `geo`, `openingHours`, `telephone` and `address`.
- Contact actions — call, WhatsApp, directions, website — as real anchors that
  work with JavaScript disabled, each firing a tracking beacon on click.
- First-party analytics: `/api/track` + `sendBeacon`, httpOnly session cookie,
  hashed user agent, **no IP stored anywhere** (the table has no column for it).
- Business owner portal: 30/90-day metrics, category-average comparison,
  hand-rolled SVG sparklines, CSV export.
- Admin: dashboard with approval queue and 30-day expiry warnings, directory
  list with status filters, per-listing tier/status/expiry controls.
- `/advertise` rate card with an enquiry form that lands directly in the admin
  queue.
- Related-listings mechanism, working in both directions.

## Decisions made

**Tiptap with JSONB bodies, rendered server-side.** Content is stored as
structured JSON and rendered to HTML on the server from a fixed extension set.
There is no path from stored content to arbitrary markup, and readers download
HTML rather than an editor. Tiptap's open-source core is MIT — **Tiptap Cloud is
not used and is not needed**.

**First-party tracking rather than a vendor.** `/api/track` on our own domain.
Ad blockers cannot interfere with the measurement a business owner is paying
for, and there is no per-event cost or third-party script.

**Deduplication enforced in Postgres, not application code.** A unique index on
`(business_id, event_type, session_hash, day)` means one visitor tapping the
phone five times is one lead. It cannot be bypassed by a client replaying
requests.

**Crawler traffic is excluded.** A Googlebot listing view is not a lead, and
counting it would inflate exactly the number used to judge renewal.

**Owner isolation enforced at the database.** RLS on `listing_events` plus
`SECURITY DEFINER` RPCs with ownership checks inside. A trigger separately
blocks owners from changing their own tier, status or expiry.

**No chart library.** The sparklines are inline SVG — one `<path>`, zero client
JavaScript, on a page read over cellular data.

**No Instagram embed.** Requested, and declined with reasoning. Third-party
embed scripts are the worst available choice for mobile load time and they send
visitors off the site. Delivered instead: share buttons with correct OpenGraph
images so a shared link renders properly in the Facebook and WhatsApp in-app
browsers, plus profile links in the footer. If the client wants the feed anyway,
it can be added lazily below the fold — but the cost should be measured first.

**No dark mode.** A deliberate single-look editorial design on cream paper.
Raised here because it is cheap now and expensive after the design system is
built on.

## Verified, not assumed

Every claim below was checked against the running application.

| Check | Result |
|---|---|
| App runs with no `.env.local` at all | 77 pages build and render from seed data |
| Listing page server-rendered | Business name, phone and address present in raw HTML |
| Contact links work without JavaScript | `tel:`, `wa.me` and Maps hrefs all in raw HTML |
| `LocalBusiness` structured data | Present with `geo`, `openingHours`, `telephone` |
| `BreadcrumbList` | Present on all directory route levels |
| `NewsArticle` on news posts | Present |
| Canonical URLs | Present on every page |
| Sitemap index + 4 split sitemaps | 50 directory / 17 town / 3 news / 13 core URLs |
| Anonymous → `/admin`, `/business` | 307 redirect to sign-in |
| Anonymous → CSV export | 403 (not an HTML login page) |
| Owner → `/admin` | 403 with a real page |
| Contributor → `/admin/directory` | 403 |
| Editor and admin → `/admin` | 200 |
| Owner dashboard leakage | Zero other businesses present in the HTML |
| Owner CSV export | Contains only the owner's business |
| Tracking: session cookie | httpOnly, SameSite=Lax, issued on first call |
| Tracking: bot user agent | Accepted (204) but not recorded |
| Tracking: malformed payload | 204, never a 500 |
| Related listings | A Denbigh news post surfaces a Denbigh business |
| **Listing page weight** | **203KB gzipped, against a 500KB budget** |

### Three bugs found and fixed

**Session-hash mismatch broke deduplication.** The tracking route generated one
session id for storage and set a *different* one as the cookie, so no two events
from the same visitor ever shared a hash and the dedupe index never fired. One
visitor tapping the phone five times would have recorded as five calls — the
exact failure that would have inflated a renewal conversation. Fixed by
resolving the session id once per request and reusing it.

**`/sitemap.xml` returned a 404.** Next's `generateSitemaps` produces the split
files but no index, so the one URL advertised in `robots.txt` and submitted to
Search Console did not exist, and none of the split sitemaps were discoverable.
Replaced with an explicit index route plus per-section routes under `/sitemaps/`.

**An empty `NEXT_PUBLIC_SITE_URL` broke the first Vercel deployment.** The site
URL was read as `process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'`.
`??` substitutes only for `null`/`undefined`, but Vercel injects a
declared-but-unset variable as an empty string — so the fallback never fired and
`new URL('')` threw during page-data collection. It built locally because the
variable was genuinely absent there.

The crash was the lucky half. `absoluteUrl()` reads the same value and does
*not* throw: had `layout.tsx` not used `new URL()`, the build would have gone
green while emitting canonical tags, OpenGraph URLs, JSON-LD `@id`s and every
sitemap entry with no origin at all — across a site whose whole business model
is search visibility.

Fixed with a resolver that treats empty and whitespace-only values as absent and
falls back through `NEXT_PUBLIC_SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` →
`VERCEL_URL` → localhost, adding the scheme (Vercel's variables are bare
hostnames) and stripping trailing slashes. `absoluteUrl()` now throws rather
than returning an origin-less path, so a regression fails loudly.

An audit of every `process.env` read found the same one-character bug class in
`ANALYTICS_SALT`, where an empty value would have silently hashed production
session ids with the development salt. Also fixed, and it now warns in
production when unset.

## Assumptions — these need the client's confirmation

1. **The Clarendon towns list** (`src/lib/constants.ts`) was compiled from
   general knowledge, not an official gazetteer. Spaldings straddles a parish
   boundary. **This drives a whole tier of SEO pages — Ventley should review it
   before launch.**

2. **Listing prices are invented placeholders** — Basic free, Standard
   J$12,000/year, Featured J$30,000/year. A free tier exists because an empty
   directory sells nothing. Prices live in the database and change without a
   deploy.

3. **All seed businesses are fictional**, marked as such in the file, using the
   non-issuable 876-555 range. They are development data and never reach
   production.

4. **Category tree is a reasonable starting structure**, not researched against
   Clarendon's actual business mix. Cheap to change now.

5. **Owner metrics currently show clearly-labelled sample figures** because no
   analytics backend is connected. Real data flows the moment Supabase is
   configured.

6. **Contact email `hello@heartlandja.com` and the social handles are assumed.**

## Costs

Phases 1 and 2 introduce **no new paid services**. Everything runs on free tiers:
Vercel Hobby, Supabase Free (500MB database, 1GB storage). Tiptap's core is MIT.

Costs begin when: a custom domain is registered; Supabase exceeds its free tier
(US$25/month Pro); or Vercel needs a paid plan for commercial use — **worth
checking, as Vercel's Hobby tier prohibits commercial projects, and this is
one.** Netlify or a small VPS are alternatives if that matters.

Deferred: Resend (free to 3,000 emails/month, Phase 5); AzuraCast VPS
(≈US$6–12/month, Phase 5, client-managed).

An online payment processor would add per-transaction fees (typically 3–5% plus
a fixed fee in Jamaica). Not needed at launch — listings are invoiced offline —
and isolated behind `src/lib/payments/` so it can be added without touching
anything else.

## One thing worth raising with the client

The directory ships before the news engine because it is the sellable milestone.
That is right commercially, but its SEO value is close to zero until Phase 3
puts news pages behind it. The category and town pages are structurally correct
and will rank for very little on launch day.

That is not a reason to reorder — founding listings sold on the promise of the
news engine is a legitimate pitch. But Ventley should be selling that promise
knowingly rather than expecting traffic in month one.

## What is deliberately not done

- The permanent news URL is `/news/[year]/[month]/[slug]` (Phase 3). The interim
  route is `/news/[slug]`. **When the dated route lands, this one must 301 to
  it, not be deleted** — any link shared in the meantime has to keep working.
- Image upload to Supabase Storage is specified but not built; there is no
  bucket to upload to yet.
- PDF export is not built. CSV covers the renewal conversation; PDF can follow
  in Phase 6 if wanted.
- `/magazine`, `/history`, `/podcast`, `/live`, `/search` and `/sections/*` are
  `noindex` placeholders so the navigation does not 404 during demonstrations.
