import { getOpenState } from '@/lib/hours'
import type { OpeningHours } from '@/types/db'

/**
 * Open / closed badge.
 *
 * A server component with no client JavaScript: the status is computed at
 * render, in Jamaica time, which is both cheaper and more correct than doing
 * it in the browser from the visitor's own clock.
 *
 * The green dot pulses while a business is actually trading and is static the
 * moment it closes. That follows the rule recorded in DESIGN.md — motion
 * reports real state, never decorates. "Open right now" is live state that is
 * otherwise invisible on a page of twenty listings; "closed" is not something
 * happening, so it does not move.
 *
 * A business with no recorded hours renders nothing. A grey "unknown" badge
 * would take up the same space to say less than silence does.
 */

export function OpenStatus({
  hours,
  size = 'full',
  className,
}: {
  hours: OpeningHours | null
  /** `compact` for directory cards, `full` for a listing page. */
  size?: 'full' | 'compact'
  className?: string
}) {
  const state = getOpenState(hours)
  if (state.status === 'unknown') return null

  const compact = size === 'compact'
  const textSize = compact ? 'text-xs' : 'text-sm'

  if (state.status === 'open') {
    return (
      <p
        className={`inline-flex items-center gap-1.5 font-medium text-success ${textSize} ${className ?? ''}`}
      >
        <Dot tone="open" />
        {compact ? 'Open' : 'Open now'}
      </p>
    )
  }

  return (
    <p
      className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${textSize} ${className ?? ''}`}
    >
      <span className="inline-flex items-center gap-1.5 font-medium text-danger">
        <Dot tone="closed" />
        Closed
      </span>
      {state.nextOpen ? (
        <span className="text-ink-faint">
          {/* Leading space, not trailing: the separator sits between two
              elements, and React emits no whitespace across that boundary. */}
          <span aria-hidden="true"> · </span>
          Opens {state.nextOpen.dayLabel} {state.nextOpen.time}
        </span>
      ) : null}
    </p>
  )
}

/**
 * The dot. aria-hidden because the word beside it already carries the meaning —
 * announcing "bullet, open now" helps nobody.
 */
function Dot({ tone }: { tone: 'open' | 'closed' }) {
  return (
    <span
      aria-hidden="true"
      className={
        tone === 'open'
          ? 'open-pulse inline-block size-2 shrink-0 rounded-full bg-success'
          : 'inline-block size-2 shrink-0 rounded-full bg-danger'
      }
    />
  )
}
