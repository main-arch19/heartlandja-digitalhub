import 'server-only'

import { PARISH_CENTRE, SITE } from '@/lib/constants'

/**
 * Homepage utility widgets — exchange rate and Clarendon weather.
 *
 * Both fetch on the SERVER. The CSP in next.config.ts sets `connect-src 'self'`,
 * so the browser cannot call an external host at all — which is what keeps the
 * no-third-party-script rule and the page-weight budget intact. Fetching here
 * also means the reader downloads plain HTML rather than a JSON payload plus
 * the code to render it.
 *
 * Neither function throws. A third-party outage must degrade to a quiet
 * "unavailable" card, never a 500 on the homepage.
 */

const TIMEOUT_MS = 5000

/** Source updates once daily; six hours keeps it fresh without hammering it. */
const FX_REVALIDATE_SECONDS = 60 * 60 * 6
const WEATHER_REVALIDATE_SECONDS = 60 * 30

// ---------------------------------------------------------------------------
// Types — local to this module. These are not database rows, so they do not
// belong in src/types/db.ts.
// ---------------------------------------------------------------------------

export interface ExchangeRate {
  /** JMD per 1 USD. */
  rate: number
  /** When the source last recalculated, ISO string. */
  updatedAt: string
  sourceName: string
  sourceUrl: string
}

export interface WeatherCondition {
  label: string
  /** Maps to an inline SVG in weather-card.tsx. */
  icon: 'sun' | 'partly' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'storm'
}

export interface WeatherDay {
  /** ISO date, e.g. 2026-09-12. */
  date: string
  high: number
  low: number
  condition: WeatherCondition
}

export interface Weather {
  temperature: number
  feelsLike: number
  condition: WeatherCondition
  precipitationChance: number
  windSpeed: number
  /** Local Jamaica time, e.g. "6:14 pm". */
  sunset: string
  /** Today plus the next five days. */
  forecast: WeatherDay[]
  place: string
}

// ---------------------------------------------------------------------------
// WMO weather codes
//
// Open-Meteo returns a numeric WMO code rather than a text description.
// https://open-meteo.com/en/docs — code table under "Weather variable documentation".
// ---------------------------------------------------------------------------

const WMO_CODES: Record<number, WeatherCondition> = {
  0: { label: 'Clear', icon: 'sun' },
  1: { label: 'Mostly sunny', icon: 'sun' },
  2: { label: 'Partly cloudy', icon: 'partly' },
  3: { label: 'Overcast', icon: 'cloud' },
  45: { label: 'Fog', icon: 'fog' },
  48: { label: 'Freezing fog', icon: 'fog' },
  51: { label: 'Light drizzle', icon: 'drizzle' },
  53: { label: 'Drizzle', icon: 'drizzle' },
  55: { label: 'Heavy drizzle', icon: 'drizzle' },
  56: { label: 'Freezing drizzle', icon: 'drizzle' },
  57: { label: 'Freezing drizzle', icon: 'drizzle' },
  61: { label: 'Light rain', icon: 'rain' },
  63: { label: 'Rain', icon: 'rain' },
  65: { label: 'Heavy rain', icon: 'rain' },
  66: { label: 'Freezing rain', icon: 'rain' },
  67: { label: 'Freezing rain', icon: 'rain' },
  71: { label: 'Light snow', icon: 'cloud' },
  73: { label: 'Snow', icon: 'cloud' },
  75: { label: 'Heavy snow', icon: 'cloud' },
  77: { label: 'Snow grains', icon: 'cloud' },
  80: { label: 'Showers', icon: 'rain' },
  81: { label: 'Showers', icon: 'rain' },
  82: { label: 'Heavy showers', icon: 'rain' },
  85: { label: 'Snow showers', icon: 'cloud' },
  86: { label: 'Snow showers', icon: 'cloud' },
  95: { label: 'Thunderstorm', icon: 'storm' },
  96: { label: 'Thunderstorm', icon: 'storm' },
  99: { label: 'Thunderstorm', icon: 'storm' },
}

function describeWeather(code: unknown): WeatherCondition {
  return (
    WMO_CODES[Number(code)] ?? { label: 'Unavailable', icon: 'cloud' }
  )
}

// ---------------------------------------------------------------------------
// Exchange rate
// ---------------------------------------------------------------------------

/**
 * USD to JMD.
 *
 * IMPORTANT: this is a mid-market reference rate, updated once daily. It is NOT
 * the rate a bank or cambio in May Pen will give anyone, and the card that
 * renders it must say so — a reader acting on it as a transactable figure would
 * be misled about money.
 *
 * Frankfurter was evaluated first and rejected: it carries ECB reference rates
 * only and does not list JMD at all.
 */
export async function getExchangeRate(): Promise<ExchangeRate | null> {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: FX_REVALIDATE_SECONDS },
    })

    if (!response.ok) {
      console.error('[widgets] exchange rate request failed:', response.status)
      return null
    }

    const data = (await response.json()) as {
      result?: string
      rates?: Record<string, number>
      time_last_update_utc?: string
    }

    const rate = data.rates?.JMD

    // Guard the shape rather than trusting it — an upstream change that drops
    // JMD should degrade to an unavailable card, not render NaN at a reader.
    if (data.result !== 'success' || typeof rate !== 'number' || !Number.isFinite(rate)) {
      console.error('[widgets] exchange rate response missing a usable JMD rate')
      return null
    }

    return {
      rate,
      updatedAt: data.time_last_update_utc
        ? new Date(data.time_last_update_utc).toISOString()
        : new Date().toISOString(),
      sourceName: 'ExchangeRate-API',
      sourceUrl: 'https://www.exchangerate-api.com',
    }
  } catch (error) {
    console.error('[widgets] exchange rate unavailable:', error)
    return null
  }
}

// ---------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------

function formatSunset(iso: string | undefined): string {
  if (!iso) return ''
  // Open-Meteo returns local Jamaica time already (timezone parameter below),
  // with no offset suffix — so parse the clock portion directly rather than
  // letting Date apply the server's timezone to it.
  const time = iso.split('T')[1]
  if (!time) return ''
  const [hourString, minute] = time.split(':')
  const hour = Number(hourString)
  if (!Number.isFinite(hour)) return ''
  const period = hour >= 12 ? 'pm' : 'am'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minute} ${period}`
}

export async function getWeather(): Promise<Weather | null> {
  const params = new URLSearchParams({
    latitude: String(PARISH_CENTRE.lat),
    longitude: String(PARISH_CENTRE.lng),
    current:
      'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunset',
    timezone: 'America/Jamaica',
    forecast_days: '6',
  })

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate: WEATHER_REVALIDATE_SECONDS },
      },
    )

    if (!response.ok) {
      console.error('[widgets] weather request failed:', response.status)
      return null
    }

    const data = (await response.json()) as {
      current?: {
        temperature_2m?: number
        apparent_temperature?: number
        weather_code?: number
        wind_speed_10m?: number
        precipitation_probability?: number
      }
      daily?: {
        time?: string[]
        weather_code?: number[]
        temperature_2m_max?: number[]
        temperature_2m_min?: number[]
        sunset?: string[]
      }
    }

    const current = data.current
    const daily = data.daily

    if (!current || typeof current.temperature_2m !== 'number') {
      console.error('[widgets] weather response missing current conditions')
      return null
    }

    // Skip index 0 (today) — the forecast row shows the days ahead.
    const forecast: WeatherDay[] = (daily?.time ?? [])
      .slice(1, 6)
      .map((date, i) => ({
        date,
        high: Math.round(daily?.temperature_2m_max?.[i + 1] ?? 0),
        low: Math.round(daily?.temperature_2m_min?.[i + 1] ?? 0),
        condition: describeWeather(daily?.weather_code?.[i + 1]),
      }))

    return {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(
        current.apparent_temperature ?? current.temperature_2m,
      ),
      condition: describeWeather(current.weather_code),
      precipitationChance: Math.round(current.precipitation_probability ?? 0),
      windSpeed: Math.round(current.wind_speed_10m ?? 0),
      sunset: formatSunset(daily?.sunset?.[0]),
      forecast,
      place: SITE.parish,
    }
  } catch (error) {
    console.error('[widgets] weather unavailable:', error)
    return null
  }
}
