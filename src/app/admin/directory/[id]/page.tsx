import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdminListingForm } from '@/components/admin/listing-form'
import { getBusinessById, getTiers } from '@/lib/data/directory'
import { getPaymentsForBusiness } from '@/lib/payments'
import { formatDate, formatMoney } from '@/lib/utils'

/**
 * Admin listing detail.
 *
 * Where an administrator approves a listing, sets its tier and expiry, and
 * records payment. These are exactly the fields an owner is blocked from
 * changing themselves.
 */

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminListingPage({ params }: PageProps) {
  const { id } = await params

  const [business, tiers, payments] = await Promise.all([
    getBusinessById(id),
    getTiers(),
    getPaymentsForBusiness(id),
  ])

  if (!business) notFound()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/admin/directory"
        className="text-xs text-ink-faint underline underline-offset-2 hover:text-green"
      >
        ← All listings
      </Link>

      <h1 className="mt-3 font-display text-2xl font-semibold">{business.name}</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {business.category.name} · {business.town}, {business.parish}
      </p>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          <h2 className="eyebrow">Listing settings</h2>
          <hr className="rule-gold mt-2 mb-5" />
          <AdminListingForm business={business} tiers={tiers} />
        </div>

        <aside className="lg:border-l lg:border-rule lg:pl-8">
          <section>
            <h2 className="eyebrow">Contact</h2>
            <hr className="rule-gold mt-2 mb-3" />
            <dl className="space-y-2 text-sm">
              <Detail label="Phone" value={business.phone} />
              <Detail label="WhatsApp" value={business.whatsapp} />
              <Detail label="Email" value={business.email} />
              <Detail label="Website" value={business.website} />
              <Detail label="Address" value={business.address} />
            </dl>
          </section>

          <section className="mt-8">
            <h2 className="eyebrow">Payments</h2>
            <hr className="rule-gold mt-2 mb-3" />
            {payments.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No payments recorded.
                <span className="mt-1 block text-xs text-ink-faint">
                  Listings are invoiced offline; record the outcome here once
                  settled.
                </span>
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {payments.map((payment) => (
                  <li key={payment.id} className="border-b border-rule pb-2 last:border-0">
                    <p className="font-medium tnum">{formatMoney(payment.amount_jmd)}</p>
                    <p className="text-xs text-ink-faint">
                      {payment.status}
                      {payment.paid_at ? ` · ${formatDate(payment.paid_at, 'short')}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {business.status === 'active' ? (
            <Link
              href={`/directory/${business.category.slug}/${business.slug}`}
              className="pressable tap-target mt-8 inline-flex items-center rounded-sm border border-rule-strong px-4 text-sm text-ink transition-colors hover:border-green hover:text-green"
            >
              View public listing
            </Link>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="break-words">{value || <span className="text-ink-faint">—</span>}</dd>
    </div>
  )
}
