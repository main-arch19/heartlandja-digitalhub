import 'server-only'

import { cookies, headers } from 'next/headers'

import { getSupabaseServiceClient, hasServiceRole } from '@/lib/supabase/client'
import type { ListingEventType } from '@/types/db'

import {
  SESSION_COOKIE,
  hashSession,
  hashUserAgent,
  isBot,
  newSessionId,
  referrerHost,
} from './session'

/**
 * Server-side event recording.
 *
 * Uses the service-role client because the visitor is anonymous and the insert
 * must succeed without a user session. The RLS policy on `listing_events`
 * already permits anonymous inserts; the service role is used so the write is
 * not affected by a visitor's (absent) JWT.
 *
 * Dedupe is enforced by a unique index in Postgres, not here — a duplicate
 * insert fails with 23505 and is swallowed. That means it cannot be bypassed by
 * a client replaying requests.
 *
 * IMPORTANT: the session id must be resolved ONCE per request and reused for
 * both the stored hash and the cookie that is sent back. If the recorder
 * generated its own id while the route set a different one, the stored hash
 * would never match the visitor's next request, dedupe would never fire, and
 * one visitor tapping five times would look like five separate leads.
 */

const DUPLICATE_KEY = '23505'

export interface RecordResult {
  recorded: boolean
  reason?: 'bot' | 'duplicate' | 'no_backend' | 'error'
}

/**
 * Resolves the caller's session id, or mints one.
 *
 * Returns `isNew` so the caller knows whether it must set the cookie on the
 * response — only the route handler can do that.
 */
export async function resolveSessionId(): Promise<{
  sessionId: string
  isNew: boolean
}> {
  const cookieStore = await cookies()
  const existing = cookieStore.get(SESSION_COOKIE)?.value
  if (existing) return { sessionId: existing, isNew: false }
  return { sessionId: newSessionId(), isNew: true }
}

export async function recordListingEvent(
  businessId: string,
  eventType: ListingEventType,
  sessionId: string,
): Promise<RecordResult> {
  const headerList = await headers()
  const userAgent = headerList.get('user-agent')

  if (isBot(userAgent)) return { recorded: false, reason: 'bot' }

  if (!hasServiceRole()) {
    // No backend configured — the app still runs, tracking is simply inert.
    return { recorded: false, reason: 'no_backend' }
  }

  const supabase = getSupabaseServiceClient()!

  const { error } = await supabase.from('listing_events').insert({
    business_id: businessId,
    event_type: eventType,
    referrer: referrerHost(headerList.get('referer')),
    user_agent_hash: hashUserAgent(userAgent),
    session_hash: hashSession(sessionId),
  })

  if (error) {
    if (error.code === DUPLICATE_KEY) return { recorded: false, reason: 'duplicate' }
    console.error('[analytics] failed to record listing event', error.message)
    return { recorded: false, reason: 'error' }
  }

  return { recorded: true }
}
