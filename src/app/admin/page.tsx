import { requireRole } from '@/lib/auth'
import Link from 'next/link'

import {
  getAdminStats,
  getExpiringBusinesses,
  getPendingBusinesses,
} from '@/lib/data/admin'
import { hasSupabase } from '@/lib/supabase/client'
import { daysUntil, formatDate, formatMoney } from '@/lib/utils'

/**
 * Admin dashboard.
 *
 * Two things matter here and everything else is secondary: what is waiting for
 * approval, and what is about to expire. The second is the renewal pipeline.
 */

export default async function AdminDashboard() {
  // Commercial admin: the directory and dashboard are admin/editor only.
  // Enforced HERE as well as in the layout — the layout admits
  // contributors so they can reach the news editor.
  await requireRole('admin', 'editor')

  const [stats, pending, expiring] = await Promise.all([
    getAdminStats(),
    getPendingBusinesses(),
    getExpiringBusinesses(),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-semibold">Dashboard</h1>

      {!hasSupabase() ? (
        <p className="mt-4 rounded-sm border border-gold/40 bg-gold-wash px-4 py-3 text-sm text-ink-muted">
          <strong className="font-medium text-ink">Demonstration data.</strong> No
          database is connected, so this shows the sample directory. Editing is
          disabled until Supabase credentials are added to <code>.env.local</code>.
        </p>
      ) : null}

      {/* --- Stats --- */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active listings" value={stats.active} />
        <Stat label="Awaiting approval" value={stats.pending} emphasis={stats.pending > 0} />
        <Stat
          label="Expiring in 30 days"
          value={stats.expiring}
          emphasis={stats.expiring > 0}
        />
        <Stat label="Paid listings" value={stats.paidListings} />
      </div>

      {/* --- Approval queue --- */}
      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="eyebrow">Awaiting approval</h2>
          <Link
            href="/admin/directory"
            className="link-target text-xs font-medium text-green underline underline-offset-2"
          >
            All listings
          </Link>
        </div>
        <hr className="rule-gold mt-2 mb-4" />

        {pending.length === 0 ? (
          <p className="text-sm text-ink-muted">Nothing waiting for approval.</p>
        ) : (
          <ul className="divide-y divide-rule border-y border-rule">
            {pending.map((business) => (
              <li
                key={business.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium">{business.name}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {business.category.name} · {business.town} ·{' '}
                    <span className="uppercase tracking-wide">{business.status}</span>
                  </p>
                </div>
                <Link
                  href={`/admin/directory/${business.id}`}
                  className="pressable tap-target inline-flex items-center rounded-sm border border-green px-4 text-sm font-medium text-green transition-colors hover:bg-green hover:text-paper"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- Renewals --- */}
      <section className="mt-12">
        <h2 className="eyebrow">Expiring within 30 days</h2>
        <hr className="rule-gold mt-2 mb-4" />

        {expiring.length === 0 ? (
          <p className="text-sm text-ink-muted">No listings expiring soon.</p>
        ) : (
          <ul className="divide-y divide-rule border-y border-rule">
            {expiring.map((business) => {
              const daysLeft = daysUntil(business.listing_expiry) ?? 0
              return (
                <li
                  key={business.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-medium">{business.name}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {business.tier.name} · {formatMoney(business.tier.price_jmd)} ·
                      expires {formatDate(business.listing_expiry)}
                    </p>
                  </div>
                  <span
                    className={
                      daysLeft <= 7
                        ? 'rounded-sm bg-danger-wash px-2 py-1 text-xs font-medium text-danger'
                        : 'rounded-sm bg-gold-wash px-2 py-1 text-xs font-medium text-ink-muted'
                    }
                  >
                    {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string
  value: number
  emphasis?: boolean
}) {
  return (
    <div
      className={
        emphasis
          ? 'rounded-sm border border-gold/50 bg-gold-wash/50 p-4'
          : 'rounded-sm border border-rule bg-paper-raised p-4'
      }
    >
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">
        {label}
      </p>
      <p className="mt-1.5 font-display text-3xl font-semibold tnum">{value}</p>
    </div>
  )
}
