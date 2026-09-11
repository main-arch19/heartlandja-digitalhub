import { PARISH_CENTRE } from '@/lib/constants'
import type { Weather, WeatherCondition } from '@/lib/data/widgets'

/**
 * Clarendon weather.
 *
 * Entirely server-rendered — no client JavaScript at all. Icons are inline SVG,
 * consistent with the rest of the site (no icon library anywhere in this build).
 *
 * The card names May Pen explicitly: Clarendon runs from the north hills to the
 * south coast and conditions genuinely differ, so labelling a single reading
 * "Clarendon" without qualification would overstate it.
 */
export function WeatherCard({ data }: { data: Weather | null }) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="eyebrow">Weather</h2>
        {data ? (
          <span className="text-[0.625rem] uppercase tracking-[0.08em] text-ink-faint">
            {PARISH_CENTRE.town}
          </span>
        ) : null}
      </div>
      <hr className="rule-gold mt-2 mb-4" />

      <div className="rounded-sm border border-rule bg-paper-sunken p-4">
        {data ? (
          <>
            {/* Current conditions */}
            <div className="flex items-start gap-3">
              <span className="shrink-0 text-gold">
                <WeatherIcon condition={data.condition} size={38} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-3xl font-semibold leading-none tnum">
                  {data.temperature}°
                </p>
                <p className="mt-1 text-sm leading-snug text-ink-muted">
                  {data.condition.label} · feels {data.feelsLike}°
                </p>
              </div>
            </div>

            {/* Detail row */}
            <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
              <div className="flex items-baseline gap-1">
                <dt>Rain</dt>
                <dd className="tnum font-medium">{data.precipitationChance}%</dd>
              </div>
              <div className="flex items-baseline gap-1">
                <dt>Wind</dt>
                <dd className="tnum font-medium">{data.windSpeed} km/h</dd>
              </div>
              {data.sunset ? (
                <div className="flex items-baseline gap-1">
                  <dt>Sunset</dt>
                  <dd className="tnum font-medium">{data.sunset}</dd>
                </div>
              ) : null}
            </dl>

            {/* Forecast */}
            {data.forecast.length > 0 ? (
              <>
                <hr className="my-3 border-rule" />
                <ul className="flex justify-between gap-1">
                  {data.forecast.map((day) => (
                    <li key={day.date} className="flex flex-col items-center gap-1">
                      <time
                        dateTime={day.date}
                        className="text-[0.6875rem] font-medium text-ink-muted"
                      >
                        {weekday(day.date)}
                      </time>
                      <span className="text-gold" title={day.condition.label}>
                        <WeatherIcon condition={day.condition} size={18} />
                      </span>
                      <span className="sr-only">{day.condition.label}, </span>
                      <span className="text-xs font-medium tnum">{day.high}°</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-ink-muted">
            The forecast is unavailable right now. Please check back shortly.
          </p>
        )}
      </div>
    </section>
  )
}

/**
 * Three-letter weekday from an ISO date.
 *
 * Parsed as UTC and formatted in Jamaica time. Constructing a Date from a bare
 * "YYYY-MM-DD" makes it midnight UTC, which is the previous evening in Jamaica —
 * formatting that back without an explicit timeZone would shift every label a
 * day earlier.
 */
function weekday(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-JM', {
    weekday: 'short',
    timeZone: 'America/Jamaica',
  }).format(date)
}

function WeatherIcon({
  condition,
  size,
}: {
  condition: WeatherCondition
  size: number
}) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (condition.icon) {
    case 'sun':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
        </svg>
      )
    case 'partly':
      return (
        <svg {...props}>
          <circle cx="9" cy="8.5" r="3.2" />
          <path d="M9 1.8v1.4M2.8 8.5h1.4M4.6 4.1l1 1" />
          <path d="M17.5 20H8a3.6 3.6 0 0 1 0-7.2 4.6 4.6 0 0 1 8.9-.6 3.4 3.4 0 0 1 .6 7.8Z" />
        </svg>
      )
    case 'cloud':
      return (
        <svg {...props}>
          <path d="M17.5 19H7a4 4 0 0 1 0-8 5 5 0 0 1 9.7-.7A3.8 3.8 0 0 1 17.5 19Z" />
        </svg>
      )
    case 'fog':
      return (
        <svg {...props}>
          <path d="M16.5 15H7a3.6 3.6 0 0 1 0-7.2 4.6 4.6 0 0 1 8.9-.6 3.4 3.4 0 0 1 .6 7.8Z" />
          <path d="M4 19h16M6 22h12" />
        </svg>
      )
    case 'drizzle':
      return (
        <svg {...props}>
          <path d="M16.5 14H7a3.6 3.6 0 0 1 0-7.2 4.6 4.6 0 0 1 8.9-.6 3.4 3.4 0 0 1 .6 7.8Z" />
          <path d="M9 18v1.5M13 18v1.5M11 21v1.5" />
        </svg>
      )
    case 'rain':
      return (
        <svg {...props}>
          <path d="M16.5 14H7a3.6 3.6 0 0 1 0-7.2 4.6 4.6 0 0 1 8.9-.6 3.4 3.4 0 0 1 .6 7.8Z" />
          <path d="M8.5 17.5 7.5 21M12.5 17.5 11.5 21M16.5 17.5 15.5 21" />
        </svg>
      )
    case 'storm':
      return (
        <svg {...props}>
          <path d="M16.5 13H7a3.6 3.6 0 0 1 0-7.2 4.6 4.6 0 0 1 8.9-.6 3.4 3.4 0 0 1 .6 7.8Z" />
          <path d="m12.5 16-3 4h4l-3 4" />
        </svg>
      )
  }
}
