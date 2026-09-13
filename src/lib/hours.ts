import { ISO_WEEKDAYS } from '@/lib/constants'
import type { OpeningHours } from '@/types/db'

/**
 * Opening-hours arithmetic.
 *
 * Everything here computes in `America/Jamaica`, never the visitor's clock. A
 * relative abroad checking whether a May Pen hardware shop is open needs to
 * know whether it is open *there* — their own timezone is not the question
 * being asked.
 *
 * These helpers lived inside `components/directory/opening-hours.tsx` while the
 * hours table was their only caller. The open/closed badge is a second caller
 * that needs the same arithmetic plus "when does it open again", so they moved
 * here rather than being duplicated or imported from a component.
 *
 * KNOWN LIMIT — overnight ranges. `isOpenNow` tests `open <= now < close`,
 * which is false for a range that crosses midnight (18:00–02:00). A bar open
 * until 2am would read as closed after midnight. No current data exercises
 * this, and fixing it properly means deciding whether `02:00` belongs to the
 * previous day's entry — a data-contract question, not a formatting one. Left
 * deliberately, and documented, rather than papered over.
 */

interface JamaicaNow {
  /** ISO weekday as a string key: '1' = Monday .. '7' = Sunday. */
  isoWeekday: string
  /** Minutes since local midnight. */
  minutes: number
}

const WEEKDAY_TO_ISO: Record<string, string> = {
  Mon: '1',
  Tue: '2',
  Wed: '3',
  Thu: '4',
  Fri: '5',
  Sat: '6',
  Sun: '7',
}

export function jamaicaNow(at: Date = new Date()): JamaicaNow {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Jamaica',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(at)

  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon'
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0')

  return {
    isoWeekday: WEEKDAY_TO_ISO[weekday] ?? '1',
    minutes: hour * 60 + minute,
  }
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** `08:00` -> `8am`, `13:30` -> `1:30pm`. */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = (h ?? 0) >= 12 ? 'pm' : 'am'
  const hour12 = (h ?? 0) % 12 === 0 ? 12 : (h ?? 0) % 12
  return m === 0
    ? `${hour12}${period}`
    : `${hour12}:${String(m).padStart(2, '0')}${period}`
}

export function isOpenNow(
  hours: OpeningHours | null,
  at: Date = new Date(),
): boolean | null {
  if (!hours) return null
  const { isoWeekday, minutes } = jamaicaNow(at)
  const today = hours[isoWeekday]
  if (!today || today.length === 0) return false
  return today.some(
    (range) => minutes >= toMinutes(range.open) && minutes < toMinutes(range.close),
  )
}

export type OpenState =
  | { status: 'open' }
  | {
      status: 'closed'
      /** Null when hours are recorded but every day is closed. */
      nextOpen: { dayLabel: string; time: string } | null
    }
  /** No hours recorded at all — show nothing rather than guess. */
  | { status: 'unknown' }

/** Next ISO weekday key, wrapping 7 -> 1. */
function nextIsoWeekday(key: string): string {
  const n = Number(key)
  return String(n === 7 ? 1 : n + 1)
}

function dayLabelFor(offset: number, isoWeekday: string): string {
  if (offset === 0) return 'today'
  if (offset === 1) return 'tomorrow'
  return ISO_WEEKDAYS.find((d) => d.key === isoWeekday)?.label ?? ''
}

/**
 * Open, closed, or unknown — and if closed, when it opens again.
 *
 * The forward walk covers seven days starting today, because "closed now" is
 * only half an answer. A visitor who cannot be served right now wants to know
 * when to come back, and "Opens tomorrow 8am" is the difference between a
 * listing that answers the question and one that sends them to phone and find
 * out.
 *
 * Today is included in the walk: a shop that opens at 8am is closed at 7am but
 * opens *today*, not tomorrow. Only ranges starting strictly after the current
 * minute count, so a range already under way cannot be reported as upcoming.
 */
export function getOpenState(
  hours: OpeningHours | null,
  at: Date = new Date(),
): OpenState {
  if (!hours) return { status: 'unknown' }

  const open = isOpenNow(hours, at)
  if (open) return { status: 'open' }

  const { isoWeekday, minutes } = jamaicaNow(at)

  let key = isoWeekday
  for (let offset = 0; offset < 7; offset += 1) {
    const ranges = hours[key]
    if (ranges && ranges.length > 0) {
      // Sorted because the data is author-entered and nothing guarantees a
      // split shift ("8-12, 2-5") was typed in order.
      const upcoming = [...ranges]
        .sort((a, b) => toMinutes(a.open) - toMinutes(b.open))
        .find((range) => offset > 0 || toMinutes(range.open) > minutes)

      if (upcoming) {
        return {
          status: 'closed',
          nextOpen: {
            dayLabel: dayLabelFor(offset, key),
            time: formatTime(upcoming.open),
          },
        }
      }
    }
    key = nextIsoWeekday(key)
  }

  // Hours recorded, but closed every day of the week. Real for a business
  // mid-renovation — say it is closed and promise nothing.
  return { status: 'closed', nextOpen: null }
}
