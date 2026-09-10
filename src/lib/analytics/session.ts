import 'server-only'

import { createHash, randomUUID } from 'node:crypto'

/**
 * Session identity for deduplication.
 *
 * The requirement is: one visitor tapping the phone twice is not two calls.
 * Meeting it needs a per-visitor identifier — but we never want the raw IP,
 * and the `listing_events` table has no column to hold one.
 *
 * So: an opaque random id in an httpOnly cookie, hashed with a server-side
 * salt before it is stored. The stored value is not reversible to the cookie,
 * and the cookie is not derived from anything about the person.
 */

export const SESSION_COOKIE = 'hja_sid'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 2 // 2 days

function salt(): string {
  // Falls back to a build-stable constant in development so dedupe still works
  // locally without configuration. Production must set ANALYTICS_SALT.
  return process.env.ANALYTICS_SALT ?? 'heartland-dev-salt'
}

export function newSessionId(): string {
  return randomUUID()
}

export function hashSession(sessionId: string): string {
  return createHash('sha256')
    .update(`${salt()}:${sessionId}`)
    .digest('hex')
    .slice(0, 32)
}

export function hashUserAgent(userAgent: string | null): string | null {
  if (!userAgent) return null
  return createHash('sha256')
    .update(`${salt()}:${userAgent}`)
    .digest('hex')
    .slice(0, 16)
}

/**
 * Crawler filter. A Googlebot listing view is not a lead, and counting it would
 * inflate exactly the number a business owner uses to judge renewal.
 */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|preview|monitor|lighthouse|pagespeed|headless|curl|wget|python-requests|axios|postman|semrush|ahrefs|mj12|dotbot|petalbot|yandex|duckduck|applebot|gptbot|claudebot|ccbot|perplexity/i

export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true
  return BOT_PATTERN.test(userAgent)
}

/** Referrer host only — we do not store full referring URLs. */
export function referrerHost(referrer: string | null): string | null {
  if (!referrer) return null
  try {
    return new URL(referrer).host || null
  } catch {
    return null
  }
}
