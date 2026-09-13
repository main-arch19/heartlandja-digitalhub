/**
 * Site-wide constants.
 *
 * The towns list is editable data, not logic — nothing branches on a specific
 * town name. Add or correct entries here and every town page, filter and
 * sitemap entry follows.
 */

/** Returns the first value that is present and not blank. */
function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

function withScheme(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

/**
 * Resolves the public origin of the site.
 *
 * Order: explicit override, then the Vercel-provided domain, then localhost.
 *
 * The empty-string handling is not defensive padding — a hosting platform
 * injects a declared-but-unset variable as `""`, which `??` does not catch,
 * because `""` is neither null nor undefined. That is what broke the first
 * Vercel deployment: `SITE.url` became `""` and `new URL("")` threw during
 * page-data collection. The quieter half of the same bug is that
 * `absoluteUrl()` would NOT have thrown — it would have emitted canonical
 * URLs, OpenGraph tags and sitemap entries with no origin at all.
 *
 * `VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_URL` are bare hostnames with no
 * protocol, so the scheme is added here. The former is set even on preview
 * deployments and resolves to the shortest production custom domain, so it
 * becomes heartlandja.com automatically once that domain is attached — no code
 * change needed at launch.
 */
function resolveSiteUrl(): string {
  const explicit = firstNonEmpty(process.env.NEXT_PUBLIC_SITE_URL)
  if (explicit) return withScheme(explicit).replace(/\/+$/, '')

  const vercelHost = firstNonEmpty(
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  )
  if (vercelHost) return `https://${vercelHost}`.replace(/\/+$/, '')

  return 'http://localhost:3000'
}

/**
 * Resolves the live radio stream, or null when none is configured.
 *
 * Null is a real state, not a failure: the AzuraCast server is client-managed
 * and does not exist yet, so the player renders disabled and says so rather
 * than offering a button that cannot work.
 *
 * `firstNonEmpty` rather than `??` for the same reason `resolveSiteUrl` uses
 * it — a hosting platform injects a declared-but-unset variable as `""`, which
 * `??` does not catch. Here that would mean `<audio src="">`, which resolves
 * against the page URL and makes the browser try to play the HTML document.
 */
function resolveStreamUrl(): string | null {
  return firstNonEmpty(process.env.NEXT_PUBLIC_STREAM_URL) ?? null
}

export const SITE = {
  name: 'Heartland JA',
  shortName: 'Heartland',
  tagline: 'The parish of Clarendon, documented.',
  description:
    'Heartland JA is the magazine, news service and business directory for the parish of Clarendon, Jamaica. Quarterly magazine, weekly parish news, and a directory of Clarendon businesses.',
  parish: 'Clarendon',
  country: 'Jamaica',
  locale: 'en_JM',
  /**
   * The public origin, with no trailing slash. Never empty — see
   * `resolveSiteUrl` for why that guarantee matters.
   */
  url: resolveSiteUrl(),
  /** The live radio stream, or null when no AzuraCast server is configured. */
  streamUrl: resolveStreamUrl(),
  publisher: 'Heartland JA',
  builtBy: 'Quantum Era Solutions',
  social: {
    instagram: 'https://www.instagram.com/heartlandja',
    facebook: 'https://www.facebook.com/heartlandja',
  },
  contact: {
    email: 'hello@heartlandja.com',
  },
} as const

/**
 * Towns and districts of Clarendon.
 *
 * ASSUMPTION FLAGGED: compiled from general knowledge of the parish, not from
 * an official gazetteer. Spaldings straddles the Clarendon/Manchester/St
 * Ann boundary. Ventley should review this list before launch — it drives the
 * /directory/town/[town] routes and therefore a whole tier of SEO pages.
 */
export const CLARENDON_TOWNS = [
  'May Pen',
  'Chapelton',
  'Frankfield',
  'Rocky Point',
  'Milk River',
  'Hayes',
  'Lionel Town',
  'Race Course',
  'Spaldings',
  'Kellits',
  'Crofts Hill',
  'Mocho',
  'Four Paths',
  'Osbourne Store',
  'Toll Gate',
  'Denbigh',
  'Bushy Park',
] as const

export type ClarendonTown = (typeof CLARENDON_TOWNS)[number]

/**
 * Reference point for parish-wide weather — May Pen, the parish capital.
 * Clarendon runs from the north hills to the south coast, so conditions vary;
 * this is the population centre, and the weather card says which town it is for.
 */
export const PARISH_CENTRE = {
  town: 'May Pen',
  lat: 17.9667,
  lng: -77.245,
} as const

/** Historical eras used as a browse axis on /history. */
export const HISTORY_ERAS = [
  'Taíno & Early Settlement',
  'Spanish Period',
  'Plantation Era',
  'Emancipation & After',
  'Colonial Clarendon',
  'Post-Independence',
  'Modern Clarendon',
] as const

/** Human labels for the news category enum. */
export const NEWS_CATEGORY_LABELS = {
  council_decisions: 'Council Decisions',
  school_results: 'School Results',
  community_events: 'Community & Church Events',
  sports_results: 'Sports Results',
  road_works: 'Road Works',
  business_openings: 'Business Openings',
  obituaries: 'Obituaries',
} as const

/** Human labels for listing event types, as a business owner would read them. */
export const LISTING_EVENT_LABELS = {
  view: 'Listing views',
  phone_tap: 'Phone taps',
  directions: 'Directions requested',
  whatsapp: 'WhatsApp messages',
  website_click: 'Website visits',
} as const

/** Short labels for tight spaces (table headers, sparkline captions). */
export const LISTING_EVENT_SHORT_LABELS = {
  view: 'Views',
  phone_tap: 'Calls',
  directions: 'Directions',
  whatsapp: 'WhatsApp',
  website_click: 'Website',
} as const

export const ISO_WEEKDAYS = [
  { key: '1', label: 'Monday', short: 'Mon' },
  { key: '2', label: 'Tuesday', short: 'Tue' },
  { key: '3', label: 'Wednesday', short: 'Wed' },
  { key: '4', label: 'Thursday', short: 'Thu' },
  { key: '5', label: 'Friday', short: 'Fri' },
  { key: '6', label: 'Saturday', short: 'Sat' },
  { key: '7', label: 'Sunday', short: 'Sun' },
] as const

/** Listings expiring within this window surface on the admin dashboard. */
export const EXPIRY_WARNING_DAYS = 30
