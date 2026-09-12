import type { Metadata } from 'next'
import Link from 'next/link'

import { MetricCard } from '@/components/business/metric-card'
import { requireRole } from '@/lib/auth'
import { getBusinessById } from '@/lib/data/directory'
import { getListingMetrics } from '@/lib/data/metrics'
import { daysUntil, formatDate } from '@/lib/utils'

/**
 * Business owner dashboard.
 *
 * This is the renewal conversation, rendered. An owner sees what their listing
 * did over 30 or 90 days, and how that compares to others in their category.
 *
 * An owner can only ever reach their OWN business id — it comes from their
 * session, never from the URL — and the underlying RPCs re-check ownership in
 * the database regardless.
 */

export const metadata: Metadata = {
  title: 'Your listing',
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{ days?: string }>
}

export default async function BusinessDashboard({ searchParams }: PageProps) {
  const session = await requireRole('business_owner', 'admin')
  const { days: daysParam } = await searchParams

  const days = daysParam === '90' ? 90 : 30

  if (!session.businessId) {
    return <NoListing />
  }

  const [business, { metrics, isDemo }] = await Promise.all([
    getBusinessById(session.businessId),
    getListingMetrics(session.businessId, days),
  ])

  if (!business) return <NoListing />

  const daysToExpiry = daysUntil(business.listing_expiry)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <p className="eyebrow">Your listing</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight">
          {business.name}
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          {business.category.name} · {business.town} ·{' '}
          <span className="font-medium">{business.tier.name}</span> listing
        </p>
      </header>

      {isDemo ? (
        <p className="mt-5 rounded-sm border border-gold/40 bg-gold-wash px-4 py-3 text-sm text-ink-muted">
          <strong className="font-medium text-ink">Sample figures.</strong> No
          analytics backend is connected yet, so these numbers illustrate the report
          rather than describing real traffic.
        </p>
      ) : null}

      {daysToExpiry !== null && daysToExpiry <= 30 ? (
        <p className="mt-5 rounded-sm border border-danger/30 bg-danger-wash px-4 py-3 text-sm">
          Your listing expires on {formatDate(business.listing_expiry)} —{' '}
          {daysToExpiry > 0 ? `${daysToExpiry} days from now` : 'today'}. Contact us to
          renew.
        </p>
      ) : null}

      {/* Period toggle — plain links, so no client JavaScript. */}
      <nav aria-label="Reporting period" className="mt-8 flex items-center gap-2">
        <PeriodLink days={30} active={days === 30} />
        <PeriodLink days={90} active={days === 90} />
      </nav>

      <section className="mt-5">
        <h2 className="sr-only">Performance over the last {days} days</h2>
        {metrics.length === 0 ? (
          <p className="rounded-sm border border-rule bg-paper-sunken p-6 text-ink-muted">
            No activity recorded yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => (
              <MetricCard key={metric.event_type} metric={metric} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/business/listing"
          className="pressable tap-target inline-flex items-center rounded-sm bg-green px-5 text-sm font-medium text-paper transition-colors hover:bg-green-deep"
        >
          Edit your listing
        </Link>
        <a
          href={`/business/report.csv?days=${days}`}
          className="pressable tap-target inline-flex items-center rounded-sm border border-rule-strong px-5 text-sm font-medium text-ink transition-colors hover:border-green hover:text-green"
        >
          Download {days}-day report (CSV)
        </a>
        <Link
          href={`/directory/${business.category.slug}/${business.slug}`}
          className="pressable tap-target inline-flex items-center rounded-sm border border-rule-strong px-5 text-sm font-medium text-ink transition-colors hover:border-green hover:text-green"
        >
          View public listing
        </Link>
      </section>

      <section className="mt-12 border-t border-rule pt-6">
        <h2 className="eyebrow">What these numbers mean</h2>
        <dl className="mt-3 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium">Listing views</dt>
            <dd className="text-ink-muted">
              How many people opened your listing page.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Phone taps</dt>
            <dd className="text-ink-muted">
              How many tapped your number to call you.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Directions requested</dt>
            <dd className="text-ink-muted">
              How many asked for directions to your premises.
            </dd>
          </div>
          <div>
            <dt className="font-medium">WhatsApp messages</dt>
            <dd className="text-ink-muted">
              How many opened WhatsApp to message you.
            </dd>
          </div>
        </dl>
        <p className="mt-4 max-w-prose text-xs leading-relaxed text-ink-faint">
          Repeat actions by the same person on the same day are counted once, and
          automated traffic is excluded — so these figures reflect people, not clicks.
        </p>
      </section>
    </div>
  )
}

function PeriodLink({ days, active }: { days: number; active: boolean }) {
  return (
    <Link
      href={`/business?days=${days}`}
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'tap-target inline-flex items-center rounded-sm border border-green bg-green px-4 text-sm font-medium text-paper'
          : 'tap-target inline-flex items-center rounded-sm border border-rule-strong px-4 text-sm font-medium text-ink-muted transition-colors hover:border-green hover:text-green'
      }
    >
      Last {days} days
    </Link>
  )
}

function NoListing() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">No listing linked yet</h1>
      <p className="mt-3 text-ink-muted">
        Your account is not yet connected to a business listing. If you have submitted
        one, it may still be awaiting approval.
      </p>
      <Link
        href="/advertise"
        className="link-target mt-2 text-sm font-medium text-green underline underline-offset-2 hover:text-green-light"
      >
        List your business
      </Link>
    </div>
  )
}
