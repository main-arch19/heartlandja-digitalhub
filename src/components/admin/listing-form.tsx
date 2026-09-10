'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { updateListingAdmin, type ActionResult } from '@/lib/data/mutations'
import { formatMoney } from '@/lib/utils'
import type { BusinessStatus, BusinessWithRelations, ListingTier } from '@/types/db'

/**
 * Admin listing controls.
 *
 * Tier, status and expiry — the three fields a business owner is blocked from
 * changing, by RLS and by a database trigger.
 */

const STATUSES: { value: BusinessStatus; label: string; help: string }[] = [
  { value: 'enquiry', label: 'Enquiry', help: 'Came in via the rate card, not yet reviewed.' },
  { value: 'pending', label: 'Pending', help: 'Submitted and awaiting approval.' },
  { value: 'active', label: 'Active', help: 'Live and publicly visible.' },
  { value: 'expired', label: 'Expired', help: 'Term lapsed; hidden from the public directory.' },
  { value: 'suspended', label: 'Suspended', help: 'Pulled by an administrator.' },
]

const fieldClass =
  'tap-target mt-1 w-full rounded-sm border border-rule-strong bg-paper-raised px-3 py-2 text-[0.9375rem] focus:border-green focus:outline-none'

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="tap-target inline-flex items-center rounded-sm bg-green px-6 text-sm font-medium text-paper transition-colors hover:bg-green-deep disabled:opacity-60"
    >
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  )
}

export function AdminListingForm({
  business,
  tiers,
}: {
  business: BusinessWithRelations
  tiers: ListingTier[]
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    updateListingAdmin,
    null,
  )

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="businessId" value={business.id} />

      {state?.message ? (
        <p
          role="status"
          className={
            state.ok
              ? 'rounded-sm border border-green/30 bg-green-wash px-4 py-3 text-sm'
              : 'rounded-sm border border-danger/30 bg-danger-wash px-4 py-3 text-sm'
          }
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <label htmlFor="status" className="block text-sm font-medium">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={business.status}
          className={fieldClass}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ink-faint">
          Only <strong>Active</strong> listings appear in the public directory.
        </p>
      </div>

      <div>
        <label htmlFor="tierId" className="block text-sm font-medium">
          Listing tier
        </label>
        <select
          id="tierId"
          name="tierId"
          defaultValue={business.tier_id}
          className={fieldClass}
        >
          {tiers.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {tier.name} — {formatMoney(tier.price_jmd)} / {tier.term_months} months
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="listingStart" className="block text-sm font-medium">
            Listing starts
          </label>
          <input
            id="listingStart"
            name="listingStart"
            type="date"
            defaultValue={business.listing_start ?? ''}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="listingExpiry" className="block text-sm font-medium">
            Listing expires
          </label>
          <input
            id="listingExpiry"
            name="listingExpiry"
            type="date"
            defaultValue={business.listing_expiry ?? ''}
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-ink-faint">
            Appears on the dashboard 30 days before this date.
          </p>
        </div>
      </div>

      <SaveButton />
    </form>
  )
}
