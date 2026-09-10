import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { SITE } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Jamaican dollars. Locale-driven so a currency change is a one-line edit.
 */
export function formatMoney(amount: number, currency = 'JMD'): string {
  if (amount === 0) return 'Free'
  return new Intl.NumberFormat('en-JM', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(
  value: string | Date | null | undefined,
  style: 'long' | 'short' = 'long',
): string {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-JM', {
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
    timeZone: 'America/Jamaica',
  }).format(date)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-JM').format(value)
}

/** Seconds to `1:04:32` / `4:32`. Used for podcast durations. */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

/**
 * Composes an absolute URL from a site-relative path.
 *
 * Throws rather than returning an origin-less path if the site URL is somehow
 * empty. Every canonical tag, OpenGraph image, JSON-LD `@id` and sitemap entry
 * flows through here, so silently emitting `/directory/plumbers` with no origin
 * would poison the whole search-visibility layer while the build stayed green.
 * `resolveSiteUrl()` already guarantees a non-empty value; this makes a
 * regression fail loudly instead of quietly.
 */
export function absoluteUrl(path = '/'): string {
  const base = SITE.url.replace(/\/+$/, '')

  if (!base) {
    throw new Error(
      'SITE.url is empty — absolute URLs cannot be built. Set NEXT_PUBLIC_SITE_URL, or check resolveSiteUrl() in src/lib/constants.ts.',
    )
  }

  return path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Jamaican numbers are +1 876 / +1 658. Strips formatting for `tel:` and
 * `wa.me` hrefs, which must be digits only.
 */
export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  return `tel:${digits}`
}

export function whatsappHref(number: string, message?: string): string {
  const digits = number.replace(/\D/g, '')
  const withCountry = digits.startsWith('1') ? digits : `1${digits}`
  const query = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${withCountry}${query}`
}

export function directionsHref(opts: {
  lat?: number | null
  lng?: number | null
  address?: string | null
  name: string
  town: string
}): string {
  if (typeof opts.lat === 'number' && typeof opts.lng === 'number') {
    return `https://www.google.com/maps/dir/?api=1&destination=${opts.lat},${opts.lng}`
  }
  const query = [opts.name, opts.address, opts.town, 'Clarendon', 'Jamaica']
    .filter(Boolean)
    .join(', ')
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`
}

/** Ensures a stored website value has a scheme before it becomes an href. */
export function externalHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

export function truncate(text: string, max = 160): string {
  const clean = text.trim().replace(/\s+/g, ' ')
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).replace(/[\s,.;:!?-]+\S*$/, '')}…`
}

export function townSlug(town: string): string {
  return slugify(town)
}

/**
 * Whole days from now until a date, negative if it has passed.
 *
 * Reading the clock is impure, so it is isolated here rather than called inline
 * during render. These pages are server components rendered once per request,
 * so "now" is fixed for the render — but keeping the impurity in one named
 * function makes that explicit rather than incidental.
 */
export function daysUntil(date: string | Date | null | undefined): number | null {
  if (!date) return null
  const target = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(target.getTime())) return null
  const now = new Date()
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
}
