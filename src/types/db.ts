/**
 * Hand-written database row types.
 *
 * These mirror `supabase/migrations/0001_init.sql` exactly. Once a Supabase
 * project exists, `supabase gen types typescript` can replace this file — the
 * shapes are deliberately written the way the generator emits them so the swap
 * is mechanical.
 *
 * The seed data in `content/seed/` is typed against these same types, which is
 * what stops the zero-backend fallback from drifting away from the real schema.
 */

// ---------------------------------------------------------------------------
// Enums (mirror Postgres enum types)
// ---------------------------------------------------------------------------

export type UserRole = 'admin' | 'editor' | 'contributor' | 'business_owner'

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'archived'

export type BusinessStatus =
  | 'enquiry' // came in via /advertise, not yet reviewed
  | 'pending' // submitted, awaiting admin approval
  | 'active' // live and publicly visible
  | 'expired' // listing term lapsed
  | 'suspended' // pulled by admin

export type ListingEventType =
  | 'view'
  | 'phone_tap'
  | 'directions'
  | 'whatsapp'
  | 'website_click'

export type NewsCategory =
  | 'council_decisions'
  | 'school_results'
  | 'community_events'
  | 'sports_results'
  | 'road_works'
  | 'business_openings'
  | 'obituaries'

export type PaymentStatus = 'unpaid' | 'invoiced' | 'paid' | 'refunded' | 'waived'

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'cheque'
  | 'card'
  | 'online'
  | 'other'

export type AdStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'ended'

// ---------------------------------------------------------------------------
// Shared column groups
// ---------------------------------------------------------------------------

/**
 * SEO overrides. Every field is nullable: null means "generate a sane default".
 * The editor only fills these in when they want to override.
 */
export interface SeoFields {
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  canonical_url: string | null
  noindex: boolean
}

/** Tiptap document. Stored as JSONB, rendered to HTML on the server. */
export interface RichTextDoc {
  type: 'doc'
  content?: unknown[]
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export interface Section extends SeoFields {
  id: string
  name: string
  slug: string
  description: string | null
  /** Longer editorial intro shown on /sections/[section]. */
  seo_copy: RichTextDoc | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Author {
  id: string
  user_id: string | null
  name: string
  slug: string
  bio: string | null
  photo_url: string | null
  /** Free-text note on what this contributor is licensed/permitted to write. */
  contributor_rights_note: string | null
  created_at: string
  updated_at: string
}

export interface Issue extends SeoFields {
  id: string
  number: number
  title: string
  slug: string
  cover_image_url: string | null
  description: string | null
  publish_date: string | null
  status: ContentStatus
  created_at: string
  updated_at: string
}

export interface Article extends SeoFields {
  id: string
  /** Null for a standalone article not tied to a quarterly issue. */
  issue_id: string | null
  section_id: string
  author_id: string | null
  title: string
  slug: string
  excerpt: string | null
  body: RichTextDoc | null
  hero_image_url: string | null
  hero_image_alt: string | null
  publish_date: string | null
  status: ContentStatus
  created_at: string
  updated_at: string
}

export interface NewsPost extends SeoFields {
  id: string
  section_id: string
  author_id: string | null
  title: string
  slug: string
  excerpt: string | null
  body: RichTextDoc | null
  category: NewsCategory
  hero_image_url: string | null
  hero_image_alt: string | null
  /** Town/district this post concerns — drives related-listing matching. */
  town: string | null
  publish_date: string | null
  status: ContentStatus
  created_at: string
  updated_at: string
}

/**
 * Evergreen parish history. Deliberately NOT a news post: no date ordering on
 * the front end, browsable by era and place, written once to rank permanently.
 */
export interface HistoryEntry extends SeoFields {
  id: string
  author_id: string | null
  title: string
  slug: string
  body: RichTextDoc | null
  excerpt: string | null
  /** e.g. "Colonial era", "Post-Independence". Browse axis. */
  era: string | null
  /** Town or district this entry concerns. Browse axis + linking key. */
  place: string | null
  hero_image_url: string | null
  hero_image_alt: string | null
  /** Provenance — where the facts came from. Shown as a sources note. */
  source_notes: string | null
  status: ContentStatus
  created_at: string
  updated_at: string
}

export interface Episode extends SeoFields {
  id: string
  title: string
  slug: string
  description: string | null
  /** Audio URL from the podcast host's RSS feed. Not self-hosted. */
  audio_url: string
  duration_seconds: number | null
  publish_date: string | null
  /** Optional link to the news post this episode discusses. */
  news_post_id: string | null
  status: ContentStatus
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Directory (revenue layer)
// ---------------------------------------------------------------------------

export interface BusinessCategory extends SeoFields {
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  /** Real editorial copy. This is what makes the category page rank. */
  seo_copy: RichTextDoc | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ListingTier {
  id: string
  name: string
  slug: string
  price_jmd: number
  /** Billing term the price covers. */
  term_months: number
  description: string | null
  max_gallery_images: number
  featured_placement: boolean
  /** How many categories a listing on this tier may appear in. */
  category_cap: number
  show_website_link: boolean
  show_whatsapp: boolean
  /** Free-form extras, rendered on the rate card. */
  features: string[]
  sort_order: number
  created_at: string
  updated_at: string
}

/** Opening hours, keyed by ISO weekday (1 = Monday .. 7 = Sunday). */
export interface OpeningHours {
  [isoWeekday: string]: { open: string; close: string }[] | null
}

export interface Business extends SeoFields {
  id: string
  owner_user_id: string | null
  category_id: string
  tier_id: string
  name: string
  slug: string
  description: string | null
  /** Longer rich-text body for higher tiers. */
  body: RichTextDoc | null
  address: string | null
  town: string
  parish: string
  lat: number | null
  lng: number | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  hours: OpeningHours | null
  logo_url: string | null
  gallery: { url: string; alt: string | null }[]
  status: BusinessStatus
  listing_start: string | null
  listing_expiry: string | null
  created_at: string
  updated_at: string
}

/**
 * Append-only. There is deliberately no IP column on this table, so a raw IP
 * cannot be stored by accident.
 */
export interface ListingEvent {
  id: string
  business_id: string
  event_type: ListingEventType
  occurred_at: string
  referrer: string | null
  user_agent_hash: string | null
  session_hash: string | null
}

export interface Payment {
  id: string
  business_id: string
  amount_jmd: number
  term_months: number
  status: PaymentStatus
  method: PaymentMethod | null
  reference: string | null
  invoiced_at: string | null
  paid_at: string | null
  period_start: string | null
  period_end: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Advertising (schema now, rendering in Phase 5)
// ---------------------------------------------------------------------------

export interface AdSlot {
  id: string
  placement_key: string
  name: string
  width: number
  height: number
  page_type: string
  created_at: string
}

export interface AdCampaign {
  id: string
  slot_id: string
  advertiser_name: string
  creative_url: string | null
  creative_alt: string | null
  target_url: string
  starts_at: string | null
  ends_at: string | null
  status: AdStatus
  created_at: string
  updated_at: string
}

export interface AdEvent {
  id: string
  campaign_id: string
  event_type: 'impression' | 'click'
  occurred_at: string
  session_hash: string | null
}

// ---------------------------------------------------------------------------
// Platform
// ---------------------------------------------------------------------------

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface Subscriber {
  id: string
  email: string
  confirmed_at: string | null
  source: string | null
  unsubscribe_token: string
  created_at: string
}

/** Editorial copy for a town/district directory page. */
export interface TownCopy extends SeoFields {
  id: string
  town: string
  slug: string
  intro: RichTextDoc | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Joined / derived shapes used by the UI
// ---------------------------------------------------------------------------

export interface BusinessWithRelations extends Business {
  category: BusinessCategory
  tier: ListingTier
}

export interface ListingMetrics {
  event_type: ListingEventType
  total: number
  /** Same metric averaged across active businesses in the same category. */
  category_average: number
  /** Daily counts, oldest first, for the sparkline. */
  series: { date: string; count: number }[]
}
