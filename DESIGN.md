# Heartland JA — Design Standard

Editorial, not startup. This is a parish publication with authority, not a SaaS
product. It should look like something Clarendon would be proud to be documented
in.

This document is the standard the interface is audited against. It is written to
be checkable, not aspirational.

---

## Identity

Heartland JA has its own identity, distinct from Quantum Era Solutions. Nothing
from the QES palette appears here.

The visual reference points are parish newspapers, regional quarterlies and
gazetteers — warm paper stock, deep ink, restrained gold rules. Not a tech
product, not a template.

## Colour

A deliberate single-look design. **No dark mode.** An editorial publication on
cream paper is a considered choice, and shipping two themes would double the
surface for contrast bugs while adding weight to a page budgeted at 500KB.
`color-scheme: light` is declared so browsers do not attempt their own inversion.

| Token | Value | Use |
|---|---|---|
| `--color-paper` | `#FAF6EE` | Page ground. Warm cream, never white. |
| `--color-paper-raised` | `#FFFDF8` | Cards, form fields sitting above the ground. |
| `--color-paper-sunken` | `#F2ECE0` | Footer, quiet panels, admin chrome. |
| `--color-ink` | `#14201A` | Body text. Near-black with a green cast. |
| `--color-ink-muted` | `#4A564F` | Secondary text, standfirsts. |
| `--color-ink-faint` | `#6D7A73` | Metadata, captions, counts. |
| `--color-green` | `#0F4D34` | Primary. Links, buttons, masthead. |
| `--color-green-deep` | `#0A3524` | Hover on primary. |
| `--color-gold` | `#B8873A` | Rules, eyebrows, section marks. Accent only. |
| `--color-rule` | `#DDD5C5` | Hairline borders. |
| `--color-danger` | `#8F2F22` | Errors, expiry warnings. |

**Gold is an accent, never a surface.** It appears as hairline rules, eyebrow
labels and section marks. Gold is never a button background and never body text —
at 4.5:1 against cream it does not pass for small text.

### Contrast requirements (WCAG 2.1 AA)

- Body text on paper: ≥ 7:1. `--color-ink` on `--color-paper` clears this.
- Secondary text: ≥ 4.5:1. `--color-ink-muted` clears this.
- `--color-ink-faint` is for non-essential metadata only, at 14px or larger.
- Interactive text on paper: ≥ 4.5:1. `--color-green` clears this.
- Never place `--color-gold` on `--color-paper` below 18px.

## Type

| Role | Family | Notes |
|---|---|---|
| Display | Fraunces (variable) | Headlines, business names, statistics. |
| Body | Inter (variable) | Everything else. |

Both are self-hosted via `next/font` — subset to latin, `display: swap`. **No
runtime request to Google Fonts.** On Jamaican cellular data a font CDN round
trip is a visible delay.

### Scale

- Page headline: `1.875rem` mobile → `2.5rem` desktop, `line-height: 1.15`
- Section headline: `1.5rem`
- Standfirst: `1.1875rem`, display face, `--color-ink-muted`
- Body: `1.0625rem`, `line-height: 1.75`
- Eyebrow: `0.6875rem`, uppercase, `letter-spacing: 0.12em`, gold
- Metadata: `0.75rem`, `--color-ink-faint`

Headlines use `text-wrap: balance`. Body copy is capped at `68ch` (`.measure`) —
a full-width paragraph on a desktop monitor is unreadable regardless of how
well-set the type is.

Any number a business owner reads as a figure uses `.tnum` (tabular numerals) so
columns align and digits do not jitter between renders.

## Editorial furniture

These are what make the publication read as a publication:

- **Eyebrow** — small-caps gold label above a headline naming the section or category.
- **Gold hairline rule** (`.rule-gold`) — separates editorial blocks. 1px, 45% opacity.
- **Standfirst** — display-face intro paragraph under a headline, in muted ink.
- **Prose** (`.prose-editorial`) — rendered rich text. Constrained measure, generous leading.

Photography-forward: where an image exists it leads, and the chrome recedes.

## Layout

- Content max-width: `72rem` (`max-w-6xl`), `1rem` mobile / `1.5rem` desktop gutters.
- Article pages: single measure column with a `18–20rem` sidebar on `lg` and above.
- Sidebar separates with a left rule on desktop, stacks below content on mobile.
- Vertical rhythm is generous. Cramped editorial reads as cheap.

## Interaction

- **Tap targets: 44×44px minimum.** Every interactive element uses `.tap-target`.
  Non-negotiable — this is a phone-first audience, often one-handed.
- Focus is always visible: 2px green outline, 2px offset. Never removed.
- Transitions are colour-only and under 200ms. No layout animation.
- `prefers-reduced-motion` is honoured globally.

## Performance

The design must hold within these limits; a visual choice that breaks them is
the wrong choice.

- Page weight: **500KB gzipped** for a news or listing page. *Currently: 203KB.*
- LCP under 2.5s on 4G, mid-range Android.
- **Zero third-party scripts.** No embeds, no tag managers, no font CDN, no
  analytics vendor. Every one of these has been declined deliberately.
- Client JavaScript only where interaction requires it: the mobile menu,
  contact-link tracking, the copy-link button, and forms. Everything else is a
  server component.
- Images: `next/image`, AVIF/WebP, explicit `sizes`, lazy below the fold.

## Accessibility

Target: **WCAG 2.1 AA**.

- Skip link to `#main` on every page.
- One `<h1>` per page; heading levels never skip.
- All interactive elements reachable and operable by keyboard.
- Form fields have real `<label>` elements, never placeholder-as-label.
- Errors are associated with fields and announced (`role="alert"`, `aria-invalid`).
- Icons are `aria-hidden`; their meaning is carried by adjacent text or `sr-only`.
- Tables have captions and `<th scope>`.
- Colour is never the only carrier of meaning — status uses a word, not just a hue.

## What this design does not do

Recorded so these stay decisions rather than drifting into defaults:

- **No Instagram or Facebook feed embed.** Third-party embed scripts are the
  single worst thing available for mobile load time, and they send visitors off
  the site. Social presence is links out, plus share buttons with correct
  OpenGraph images so a shared link renders properly in the Facebook and
  WhatsApp in-app browsers.
- **No dark mode.** See Colour.
- **No chart library.** The owner dashboard's trend lines are hand-rolled inline
  SVG — one `<path>`, zero client JavaScript.
- **No carousels, no hero sliders, no parallax.** Editorial pages do not need them.
