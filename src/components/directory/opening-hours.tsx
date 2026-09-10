import { ISO_WEEKDAYS } from '@/lib/constants'
import type { OpeningHours as OpeningHoursType } from '@/types/db'

/**
 * Opening hours table.
 *
 * "Open now" is deliberately computed on the server in Jamaica time rather than
 * from the visitor's clock — a visitor abroad checking a May Pen shop should
 * see whether it is open *there*.
 */

function jamaicaNow(): { isoWeekday: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Jamaica',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())

  const weekdayMap: Record<string, string> = {
    Mon: '1', Tue: '2', Wed: '3', Thu: '4', Fri: '5', Sat: '6', Sun: '7',
  }

  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon'
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0')

  return { isoWeekday: weekdayMap[weekday] ?? '1', minutes: hour * 60 + minute }
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour12}${period}` : `${hour12}:${String(m).padStart(2, '0')}${period}`
}

export function isOpenNow(hours: OpeningHoursType | null): boolean | null {
  if (!hours) return null
  const { isoWeekday, minutes } = jamaicaNow()
  const today = hours[isoWeekday]
  if (!today || today.length === 0) return false
  return today.some(
    (range) => minutes >= toMinutes(range.open) && minutes < toMinutes(range.close),
  )
}

export function OpeningHours({ hours }: { hours: OpeningHoursType | null }) {
  if (!hours) return null

  const { isoWeekday } = jamaicaNow()
  const open = isOpenNow(hours)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="eyebrow">Opening hours</h2>
        {open !== null ? (
          <span
            className={
              open
                ? 'text-xs font-medium text-success'
                : 'text-xs font-medium text-ink-faint'
            }
          >
            {open ? 'Open now' : 'Closed now'}
          </span>
        ) : null}
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
