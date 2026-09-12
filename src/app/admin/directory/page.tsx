import { requireRole } from '@/lib/auth'
import Link from 'next/link'

import { getAllBusinessesAdmin } from '@/lib/data/admin'
import { formatDate, formatMoney } from '@/lib/utils'
import type { BusinessStatus } from '@/types/db'

/**
 * Admin directory list.
 *
 * Filtering is done with plain links and a search param, so the whole page
 * stays server-rendered with no client JavaScript.
 */

const STATUS_FILTERS: { value: BusinessStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'enquiry', label: 'Enquiries' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'suspended', label: 'Suspended' },
]

const STATUS_STYLES: Record<BusinessStatus, string> = {
  enquiry: 'bg-gold-wash text-ink-muted',
  pending: 'bg-gold-wash text-ink-muted',
  active: 'bg-green-wash text-green',
  expired: 'bg-danger-wash text-danger',
  suspended: 'bg-danger-wash text-danger',
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminDirectoryPage({ searchParams }: PageProps) {
  // Commercial admin: the directory and dashboard are admin/editor only.
  // Enforced HERE as well as in the layout — the layout admits
  // contributors so they can reach the news editor.
  await requireRole('admin', 'editor')

  const { status } = await searchParams
  const filter = (status ?? 'all') as BusinessStatus | 'all'

  const all = await getAllBusinessesAdmin()
  const businesses = filter === 'all' ? all : all.filter((b) => b.status === filter)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-semibold">Directory</h1>

      <nav aria-label="Filter by status" className="mt-5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((option) => {
          const active = filter === option.value
          const count =
            option.value === 'all'
              ? all.length
              : all.filter((b) => b.status === option.value).length
          return (
            <Link
              key={option.value}
              href={
                option.value === 'all'
                  ? '/admin/directory'
                  : `/admin/directory?status=${option.value}`
              }
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'tap-target inline-flex items-center rounded-sm border border-green bg-green px-3.5 text-sm font-medium text-paper'
                  : 'tap-target inline-flex items-center rounded-sm border border-rule-strong px-3.5 text-sm text-ink-muted transition-colors hover:border-green hover:text-green'
              }
            >
              {option.label}
              <span className="ml-1.5 text-xs opacity-75 tnum">{count}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <caption className="sr-only">Directory listings</caption>
          <thead>
            <tr className="border-b border-rule-strong text-left">
              <th scope="col" className="py-2 pr-3 font-medium">Business</th>
              <th scope="col" className="py-2 pr-3 font-medium">Category</th>
              <th scope="col" className="py-2 pr-3 font-medium">Town</th>
              <th scope="col" className="py-2 pr-3 font-medium">Tier</th>
              <th scope="col" className="py-2 pr-3 font-medium">Status</th>
              <th scope="col" className="py-2 pr-3 font-medium">Expires</th>
              <th scope="col" className="py-2 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {businesses.map((business) => (
              <tr key={business.id}>
                <td className="py-2.5 pr-3 font-medium">{business.name}</td>
                <td className="py-2.5 pr-3 text-ink-muted">{business.category.name}</td>
                <td className="py-2.5 pr-3 text-ink-muted">{business.town}</td>
                <td className="py-2.5 pr-3 text-ink-muted">
                  {business.tier.name}
                  <span className="block text-xs text-ink-faint tnum">
                    {formatMoney(business.tier.price_jmd)}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[business.status]}`}
                  >
                    {business.status}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-ink-muted tnum">
                  {business.listing_expiry ? formatDate(business.listing_expiry, 'short') : '—'}
                </td>
                <td className="py-2.5 text-right">
                  <Link
                    href={`/admin/directory/${business.id}`}
                    className="text-green underline underline-offset-2 hover:text-green-light"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {businesses.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            No listings with that status.
          </p>
        ) : null}
      </div>
    </div>
  )
}
