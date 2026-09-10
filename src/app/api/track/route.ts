import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { recordListingEvent, resolveSessionId } from '@/lib/analytics/record'
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/analytics/session'

/**
 * First-party tracking endpoint.
 *
 * On our own domain, so ad blockers do not interfere with the measurement a
 * business owner is paying for. Called via `navigator.sendBeacon`, which does
 * not block navigation — the visitor's phone call starts immediately and the
 * event is recorded in the background.
 *
 * Always returns 204. A tracking failure must never surface to a visitor, and
 * the response body is never used by the client.
 */

export const runtime = 'nodejs'

const payloadSchema = z.object({
  businessId: z.string().min(1).max(64),
  eventType: z.enum(['view', 'phone_tap', 'directions', 'whatsapp', 'website_click']),
})

const NO_CONTENT = { status: 204 } as const

export async function POST(request: NextRequest) {
  // Resolve the session id first and reuse it for both the stored hash and the
  // cookie below, so a first-time visitor's stored hash matches the id they
  // will send on their next request. Dedupe depends on this.
  const { sessionId, isNew } = await resolveSessionId()

  const response = new NextResponse(null, NO_CONTENT)

  if (isNew) {
    // httpOnly so page scripts cannot read or forge it; SameSite=Lax so it
    // survives normal navigation but is not sent on cross-site POSTs.
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })
  }

  let body: unknown
  try {
    // sendBeacon sends a Blob; text() then parse handles both it and fetch().
    body = JSON.parse(await request.text())
  } catch {
    return response
  }

  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) return response

  await recordListingEvent(parsed.data.businessId, parsed.data.eventType, sessionId)

  return response
}
