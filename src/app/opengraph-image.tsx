import { ImageResponse } from 'next/og'

import { SITE } from '@/lib/constants'

/**
 * Default OpenGraph image.
 *
 * Generated at the edge by Next's ImageResponse — no external image service, no
 * recurring cost. This is what renders when a link is shared into the Facebook
 * or WhatsApp in-app browser, so it has to carry the masthead legibly at
 * thumbnail size.
 *
 * Uses system-stacked fonts rather than fetching a font file: an OG image is
 * generated on a cold path and a font fetch is the slowest part of it.
 */

export const alt = `${SITE.name} — ${SITE.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FAF6EE',
          padding: '72px',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: '#B8873A',
              fontFamily: 'Helvetica, Arial, sans-serif',
            }}
          >
            Clarendon, Jamaica
          </div>
          {/* Satori requires an explicit display on any element with more than
              one child — a text node plus a span counts as two. */}
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: 92,
              lineHeight: 1.05,
              color: '#0F4D34',
              fontWeight: 600,
            }}
          >
            <span>Heartland&nbsp;</span>
            <span style={{ color: '#B8873A' }}>JA</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 2, background: '#B8873A', opacity: 0.5 }} />
          <div
            style={{
              marginTop: 28,
              fontSize: 38,
              color: '#4A564F',
              lineHeight: 1.3,
            }}
          >
            {SITE.tagline}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
