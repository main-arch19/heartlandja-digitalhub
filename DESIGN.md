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
gazetteers — deep ink, restrained gold rules, generous measure. Not a tech
product, not a template.

The paper character now lives in the masthead band and in the typography rather
than in the page ground, which is white. The serif headlines, the gold eyebrows
and the rules carry the editorial identity; tinting every page behind the text
was not what was carrying it.

## Colour

A deliberate single-look design. **No dark mode.** Shipping two themes would
double the surface for contrast bugs while adding weight to a page budgeted at
500KB. `color-scheme: light` is declared so browsers do not attempt their own
inversion.

**The page is white.** The warm cream survives in exactly one place — the
masthead band — where it carries the publication's character without tinting
every page behind the text.

| Token | Value | Use |
|---|---|---|
| `--color-paper` | `#FFFFFF` | Page ground. Also the label on green buttons (`text-paper`). |
| `--color-masthead` | `#FAF6EE` | **Masthead band only.** Never below the primary nav. |
| `--color-paper-raised` | `#FFFFFF` | Reading surfaces — cards, listings, form fields. |
| `--color-paper-sunken` | `#F4F6F5` | Footer, quiet panels, admin chrome. Neutral grey. |
| `--color-ink` | `#14201A` | Body text. Near-black with a green cast. |
| `--color-ink-muted` | `#4A564F` | Secondary text, standfirsts. |
| `--color-ink-faint` | `#5C6961` | Metadata, captions, counts. |
| `--color-green` | `#0F4D34` | Primary. Links, buttons, masthead. |
| `--color-green-deep` | `#0A3524` | Hover on primary. |
| `--color-gold` | `#B8873A` | Brand gold: wordmark, `.rule-gold`, decorative marks. |
| `--color-gold-text` | `#9C6B26` | **Gold as text** — `.eyebrow` only. Passes AA at 4.62:1. |
| `--color-rule` | `#E3E6E4` | Hairline borders. Neutral grey. |
| `--color-rule-strong` | `#C8CDCA` | Inputs, table heads. |
| `--color-danger` | `#8F2F22` | Errors, expiry warnings. |

**`paper` means white, not cream.** The name was kept rather than renamed
because the token is also a *foreground* — `text-paper` is the label on green
buttons in 22 places — and renaming would churn those call sites for cosmetic
reasons.

**Gold is an accent, never a surface.** It appears as hairline rules, eyebrow
labels and section marks, never as a button background or body text.

**Keep the two golds separate.** `--color-gold` (`#B8873A`) measures 3.20:1 on
white, which is below AA for the 11px eyebrow label used above nearly every
headline. `--color-gold-text` (`#9C6B26`) clears it at 4.62:1. Re-unifying them
would silently push 56 eyebrow labels back under AA.

### Contrast requirements (WCAG 2.1 AA)

Grounds to check against: **white** (the page), **`#F4F6F5`** (panels), and
**`#FAF6EE`** (the masthead band).

- Body text: ≥ 7:1. `--color-ink` on white clears this at 16.78.
- Secondary text: ≥ 4.5:1. `--color-ink-muted` clears this at 7.68 on white, 7.07 on panels.
- `--color-ink-faint` clears 4.5:1 on all three grounds (white 5.76, panels 5.30, masthead 5.34). **The panels are the binding constraint** — check against those, not white.
- Interactive text: ≥ 4.5:1. `--color-green` clears this at 9.85 on white.
- Never place `--color-gold` on any ground below 18px — use `--color-gold-text`.

## Type

| Role | Family | Notes |
|---|---|---|
| Display | Fraunces (variable) | Headlines, business names, statistics. |
| Body | Inter (variable) | Everything else. |

Both are self-hosted via `next/font` — subset to latin, `display: swap`. **No
runtime request to Google Fonts.** On Jamaican cellular data a font CDN round
trip is a visible delay.

### Scale

- **Lead headline** (`.display-lead`): `2.125rem` mobile → `3rem` desktop,
  `line-height: 1.08`, tracking `-0.022em` → `-0.028em`. The one decisively
  largest thing on a page. Measured on a 390px phone the scale had collapsed —
  a single 30px headline and then sixteen elements at 20px and nineteen at
  16px — and a page where nothing is decisively largest has no focal point.
  That flatness was most of what read as unfinished. The step is now 1.7×
  over the row headlines beneath it. Tracking tightens as the size grows,
  which is what stops large display serif looking loose.
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

**Where no image exists, nothing renders.** No grey box, no placeholder frame,
no icon in a dashed rectangle. An empty slot advertises an absence; no slot at
all simply reads as a design that did not call for a picture there. That rule
is enforced by `EditorialImage` in `src/components/editorial/editorial-image.tsx`,
which returns `null` on a missing `src`.

The single exception is a directory listing's mark. A directory is a grid, and
a missing logo leaves a hole where its neighbours have one — so `BusinessMark`
falls back to a monogram of the business's own initials in the display face. It
invents no imagery.

## Elevation

Since the page ground and the card ground are both white, a card separates from
the page by a 1px hairline alone, which reads as undressed rather than clean.
`.card-lift` supplies the missing depth:

| Token | Value |
|---|---|
| `--shadow-card` | `0 1px 2px rgb(20 32 26 / 0.04), 0 4px 12px rgb(20 32 26 / 0.03)` |
| `--shadow-card-hover` | `0 1px 2px rgb(20 32 26 / 0.05), 0 8px 24px rgb(20 32 26 / 0.06)` |

Deliberately weak — the shadow you notice only once it is gone. Tinted with the
ink hue rather than pure black, because a neutral-black shadow over a warm
design reads as grey smudge.

- **Public card surfaces only** — listing cards, widgets, topic cards. Not admin
  forms or panels: those are tools, and a tool that looks like a brochure is
  harder to scan.
- A card on a translucent ground must be made **opaque** first. A shadow beneath
  a see-through card shows through its face and reads as dirt.
- The hover state changes `box-shadow` only, never `transform`. These sit in
  dense grids, and a scaling card nudges its neighbours' perceived alignment.

## Layout

- Content max-width: `72rem` (`max-w-6xl`), `1rem` mobile / `1.5rem` desktop gutters.
- **Every `grid` that gains columns at `lg:` must also declare
  `grid-cols-[minmax(0,1fr)]` at the base breakpoint.** A grid item defaults to
  `min-width: auto`, which refuses to shrink below its content's intrinsic
  width — on a 320px phone that pushed the document to 344px and broke the page
  horizontally. `minmax(0,1fr)` at `lg:` alone does not protect mobile.
- Verified: no horizontal overflow at 320, 360, 390 or 430px on any page.
- Article pages: single measure column with a `18–20rem` sidebar on `lg` and above.
- Sidebar separates with a left rule on desktop, stacks below content on mobile.
- Vertical rhythm is generous. Cramped editorial reads as cheap.

## Interaction

- **Tap targets: 44×44px minimum.** Three utilities cover this:
  - `.tap-target` — buttons and primary actions, 44px.
  - `.link-target` — a standalone text link on its own line. Extends the hit
    area vertically without changing how the link looks. Inline links inside
    prose deliberately do NOT use it: padding there breaks the line rhythm of
    body copy, and those links are read rather than aimed at.
  - `.chip-target` — 40px, for chips in a dense wrapping grid (town filters).
    44px there reads as a button stack rather than a filter row; 40px clears
    the practical mis-hit threshold while keeping editorial density.
  Non-negotiable — this is a phone-first audience, often one-handed.
- Focus is always visible: 2px green outline, 2px offset. Never removed.
- Transitions are under 200ms and touch colour and `transform` only. **No
  layout animation** — nothing animates a property that triggers reflow.
- **Motion must report real state, never decorate.** Three pieces of motion
  exist and all three meet that test:
  - `.pressable` — 120ms, `scale(0.98)` on press. On a phone there is no hover,
    so this is the only confirmation a tap registered.
  - `.open-pulse` — the green dot on an "Open now" badge. Pulses *only* while a
    business is actually trading; the red "Closed" dot never animates, because
    nothing is happening. 2000ms, deliberately slow: a directory page can carry
    twenty of these, and anything faster reads as flicker.
  - `.eq-bar` — the equaliser beside the live radio button. Animates *only*
    while audio is actually playing; idle, disabled and error states render the
    same bars at rest. Unequal durations (900–1400ms) so the bars never sync
    into a single pulse, which would read as a heartbeat rather than audio.
  A third piece of motion needs to clear the same bar: what state does it
  report, and is that state otherwise invisible?
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
