import { OpenStatus } from '@/components/directory/open-status'
import { ISO_WEEKDAYS } from '@/lib/constants'
import { formatTime, isOpenNow, jamaicaNow } from '@/lib/hours'
import type { OpeningHours as OpeningHoursType } from '@/types/db'

/**
 * Opening hours table.
 *
 * The arithmetic lives in `@/lib/hours` rather than here, because the
 * open/closed badge needs the same calculations plus "when does it open
 * again". "Open now" is computed on the server in Jamaica time rather than
 * from the visitor's clock — a visitor abroad checking a May Pen shop should
 * see whether it is open *there*.
 */

/**
 * Re-exported for callers that already import it from this module. The
 * implementation moved to `@/lib/hours`; prefer importing from there directly
 * in new code.
 */
export { isOpenNow }

export function OpeningHours({ hours }: { hours: OpeningHoursType | null }) {
  if (!hours) return null

  const { isoWeekday } = jamaicaNow()

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="eyebrow">Opening hours</h2>
        {/* The same component the cards and the listing header use, so the
            table can never disagree with the badge above it. */}
        <OpenStatus hours={hours} size="compact" />
      </div>
      <hr className="rule-gold mt-2 mb-3" />

      <table className="w-full text-sm">
        <caption className="sr-only">Opening hours by day</caption>
        <tbody>
          {ISO_WEEKDAYS.map((day) => {
            const ranges = hours[day.key]
            const isToday = day.key === isoWeekday
            return (
              <tr key={day.key} className={isToday ? 'font-medium' : undefined}>
                <th scope="row" className="py-1 text-left font-normal text-ink-muted">
                  <span className={isToday ? 'text-ink' : undefined}>{day.label}</span>
                </th>
                <td className="py-1 text-right tnum">
                  {!ranges || ranges.length === 0 ? (
                    <span className="text-ink-faint">Closed</span>
                  ) : (
                    ranges
                      .map((r) => `${formatTime(r.open)}–${formatTime(r.close)}`)
                      .join(', ')
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
