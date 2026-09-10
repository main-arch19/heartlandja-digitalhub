import { LISTING_EVENT_LABELS } from '@/lib/constants'
import { formatNumber } from '@/lib/utils'
import type { ListingMetrics } from '@/types/db'

/**
 * Metric tile with a trend line.
 *
 * The sparkline is hand-rolled inline SVG. A charting library would add
 * 40–150KB of client JavaScript to render what is fundamentally one `<path>`,
 * and this page is read on the same mid-range Android as everything else.
 *
 * Server-rendered — no client JavaScript at all on the owner dashboard.
 */

function Sparkline({ series }: { series: { date: string; count: number }[] }) {
  if (series.length < 2) return null

  const width = 100
  const height = 28
  const max = Math.max(...series.map((s) => s.count), 1)

  const points = series.map((point, i) => {
    const x = (i / (series.length - 1)) * width
    const y = height - (point.count / max) * (height - 2) - 1
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  const line = `M ${points.join(' L ')}`
  const area = `${line} L ${width},${height} L 0,${height} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="mt-3 h-8 w-full"
      role="img"
      aria-label={`Daily trend over ${series.length} days`}
    >
      <path d={area} fill="var(--color-green)" opacity="0.08" />
      <path
        d={line}
        fill="none"
        stroke="var(--color-green)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Comparison to the category average.
 *
 * Shown as a plain sentence rather than a coloured percentage badge: a business
 * owner reading "slightly below average for restaurants" understands it
 * immediately, and it does not turn a quiet month into an alarm.
 */
function Comparison({ total, average }: { total: number; average: number }) {
  if (average <= 0) return null

  const ratio = total / average
  let label: string
  if (ratio >= 1.25) label = 'above average for your category'
  else if (ratio >= 1.05) label = 'slightly above average'
  else if (ratio >= 0.95) label = 'about average for your category'
  else if (ratio >= 0.75) label = 'slightly below average'
  else label = 'below average for your category'

  return (
    <p className="mt-2 text-xs leading-relaxed text-ink-faint">
      {label} ({formatNumber(average)})
    </p>
  )
}

export function MetricCard({ metric }: { metric: ListingMetrics }) {
  return (
    <div className="rounded-sm border border-rule bg-paper-raised p-4">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">
        {LISTING_EVENT_LABELS[metric.event_type]}
      </p>
      <p className="mt-1.5 font-display text-3xl font-semibold text-ink tnum">
        {formatNumber(metric.total)}
      </p>
      <Comparison total={metric.total} average={metric.category_average} />
      <Sparkline series={metric.series} />
    </div>
  )
}
