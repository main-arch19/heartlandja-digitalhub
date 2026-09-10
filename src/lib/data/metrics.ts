import 'server-only'

import { getSupabaseServerClient, hasSupabase } from '@/lib/supabase/client'
import type { ListingEventType, ListingMetrics } from '@/types/db'

/**
 * Listing metrics.
 *
 * Reads go through the `business_metrics_*` Postgres functions, which are
 * SECURITY DEFINER with an explicit ownership check inside. An owner passing
 * another business's id gets an exception, not data — the isolation is enforced
 * in the database, so it holds even if a bug here forgot to check.
 *
 * With no Supabase configured, deterministic demo figures are generated so the
 * owner portal can be shown to a prospective advertiser before any real traffic
 * exists. They are clearly labelled as sample data in the UI.
 */

const EVENT_TYPES: ListingEventType[] = [
  'view',
  'phone_tap',
  'directions',
  'whatsapp',
  'website_click',
]

/** Stable pseudo-random from a string seed, so demo numbers never jump around. */
function seededValue(seed: string, max: number): number {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % (max + 1)
}

function demoMetrics(businessId: string, days: number): ListingMetrics[] {
  const scale = days / 30

  return EVENT_TYPES.map((eventType) => {
    const base = {
      view: 140,
      phone_tap: 22,
      directions: 14,
      whatsapp: 11,
      website_click: 8,
    }[eventType]

    const total = Math.round(
      (base + seededValue(`${businessId}:${eventType}`, Math.round(base * 0.4))) * scale,
    )

    const series = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setUTCDate(date.getUTCDate() - (days - 1 - i))
      const daily = Math.max(
        0,
        Math.round(
          total / days +
            (seededValue(`${businessId}:${eventType}:${i}`, 6) - 3) * (total / days) * 0.3,
        ),
      )
      return { date: date.toISOString().slice(0, 10), count: daily }
    })

    return {
      event_type: eventType,
      total,
      category_average: Math.round(total * 0.82),
      series,
    }
  })
}

export async function getListingMetrics(
  businessId: string,
  days = 30,
): Promise<{ metrics: ListingMetrics[]; isDemo: boolean }> {
  if (!hasSupabase()) {
    return { metrics: demoMetrics(businessId, days), isDemo: true }
  }

  const supabase = await getSupabaseServerClient()

  const [totalsResult, seriesResult] = await Promise.all([
    supabase!.rpc('business_metrics_totals', {
      p_business_id: businessId,
      p_days: days,
    }),
    supabase!.rpc('business_metrics_series', {
      p_business_id: businessId,
      p_days: days,
    }),
  ])

  if (totalsResult.error || seriesResult.error) {
    // An authorisation failure raised by the RPC lands here. Surfacing empty
    // metrics rather than another business's data is the safe failure.
    console.error(
      '[metrics] failed to load listing metrics',
      totalsResult.error?.message ?? seriesResult.error?.message,
    )
    return { metrics: [], isDemo: false }
  }

  type TotalRow = { event_type: ListingEventType; total: number; category_average: number }
  type SeriesRow = { day: string; event_type: ListingEventType; count: number }

  const totals = (totalsResult.data ?? []) as TotalRow[]
  const series = (seriesResult.data ?? []) as SeriesRow[]

  const metrics: ListingMetrics[] = EVENT_TYPES.map((eventType) => {
    const row = totals.find((t) => t.event_type === eventType)
    return {
      event_type: eventType,
      total: Number(row?.total ?? 0),
      category_average: Number(row?.category_average ?? 0),
      series: series
        .filter((s) => s.event_type === eventType)
        .map((s) => ({ date: s.day, count: Number(s.count) })),
    }
  })

  return { metrics, isDemo: false }
}

/** CSV export for the owner's own listing, and for admin per-business reports. */
export function metricsToCsv(
  metrics: ListingMetrics[],
  businessName: string,
  days: number,
): string {
  const lines: string[] = []

  lines.push(`Heartland JA — Listing report`)
  lines.push(`Business,${csvEscape(businessName)}`)
  lines.push(`Period,Last ${days} days`)
  lines.push(`Generated,${new Date().toISOString().slice(0, 10)}`)
  lines.push('')
  lines.push('Metric,Total,Category average')

  for (const metric of metrics) {
    lines.push(
      [csvEscape(metric.event_type), metric.total, metric.category_average].join(','),
    )
  }

  lines.push('')
  lines.push('Date,' + metrics.map((m) => csvEscape(m.event_type)).join(','))

  const dates = metrics[0]?.series.map((s) => s.date) ?? []
  for (const date of dates) {
    const row = [date]
    for (const metric of metrics) {
      row.push(String(metric.series.find((s) => s.date === date)?.count ?? 0))
    }
    lines.push(row.join(','))
  }

  return lines.join('\n')
}

/**
 * Guards against CSV injection: a leading =, +, - or @ makes spreadsheet
 * software treat a cell as a formula. Business names are owner-supplied.
 */
function csvEscape(value: string): string {
  const needsPrefix = /^[=+\-@\t\r]/.test(value)
  const escaped = value.replace(/"/g, '""')
  return `"${needsPrefix ? `'${escaped}` : escaped}"`
}
