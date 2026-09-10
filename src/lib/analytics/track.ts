'use client'

import type { ListingEventType } from '@/types/db'

/**
 * Client-side event beacon.
 *
 * `sendBeacon` is the right primitive here: it hands the request to the browser
 * and returns immediately, and the browser completes it even as the page is
 * being torn down by a `tel:` handoff or an outbound navigation. A plain
 * `fetch` would be cancelled mid-flight on exactly the clicks that matter most.
 *
 * Never throws, never blocks, never awaited by a caller.
 */

const ENDPOINT = '/api/track'

export function track(businessId: string, eventType: ListingEventType): void {
  if (typeof window === 'undefined') return

  const payload = JSON.stringify({ businessId, eventType })

  try {
    if (navigator.sendBeacon) {
      // Blob with an explicit type so the endpoint receives parseable JSON.
      const blob = new Blob([payload], { type: 'application/json' })
      if (navigator.sendBeacon(ENDPOINT, blob)) return
    }

    // Fallback for browsers without sendBeacon, or when it refuses (payload
    // over the queue limit). keepalive lets it outlive the page.
    void fetch(ENDPOINT, {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {
      /* tracking must never surface an error to a visitor */
    })
  } catch {
    /* tracking must never surface an error to a visitor */
  }
}
