import Link from 'next/link'
import { redirect } from 'next/navigation'

import { OwnerListingForm } from '@/components/business/owner-listing-form'
import { requireRole } from '@/lib/auth'
import { getBusinessById } from '@/lib/data/directory'
import { formatDate } from '@/lib/utils'

/**
 * Owner listing editor.
 *
 * An owner edits their own contact details and description. Tier, status and
 * expiry are shown read-only — they are set by an administrator, and blocked
 * for owners by both RLS and a database trigger.
 */

export const metadata = {
  title: 'Edit your listing',
  robots: { index: false, follow: false },
}

export default async function OwnerListingPage() {
  const session = await requireRole('business_owner', 'admin')
  if (!session.businessId) redirect('/business')

  const business = await getBusinessById(session.businessId)
  if (!business) redirect('/business')

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/business"
        className="text-xs text-ink-faint underline underline-offset-2 hover:text-green"
      >
        ← Back to your figures
      </Link>

      <h1 className="mt-3 font-display text-2xl font-semibold">Edit your listing</h1>
      <p className="mt-1.5 text-sm text-ink-muted">{business.name}</p>

      <div className="mt-8">
        <OwnerListingForm business={business} />
      </div>

      <section className="mt-12 rounded-sm border border-rule bg-paper-sunken p-5">
        <h2 className="eyebrow">Set by Heartland JA</h2>
        <hr className="rule-gold mt-2 mb-3" />
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-faint">Listing tier</dt>
            <dd className="font-medium">{business.tier.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-faint">Status</dt>
            <dd className="font-medium capitalize">{business.status}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-faint">Expires</dt>
            <dd className="font-medium">
              {business.listing_expiry ? formatDate(business.listing_expiry) : '—'}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          To upgrade your tier or renew, contact us at{' '}
          <a
            href="mailto:hello@heartlandja.com"
            className="text-green underline underline-offset-2"
          >
            hello@heartlandja.com
          </a>
          .
        </p>
      </section>
    </div>
  )
}
