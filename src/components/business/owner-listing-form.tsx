'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { updateOwnListing, type ActionResult } from '@/lib/data/mutations'
import type { BusinessWithRelations } from '@/types/db'

/**
 * Owner-editable listing fields.
 *
 * Only the fields an owner is permitted to change. Tier, status, expiry, slug
 * and ownership are absent — and would be rejected by the database even if
 * someone posted them.
 */

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

export function OwnerListingForm({ business }: { business: BusinessWithRelations }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    updateOwnListing,
    null,
  )

  const tier = business.tier

  return (
    <form action={formAction} className="space-y-5">
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
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={600}
          defaultValue={business.description ?? ''}
          className={fieldClass}
        />
        <p className="mt-1 text-xs text-ink-faint">
          What you do, in plain language. This is what people read first.
        </p>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium">
          Address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={business.address ?? ''}
          className={fieldClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={business.phone ?? ''}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="whatsapp" className="block text-sm font-medium">
            WhatsApp number
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            defaultValue={business.whatsapp ?? ''}
            disabled={!tier.show_whatsapp}
            className={`${fieldClass} disabled:bg-paper-sunken disabled:text-ink-faint`}
          />
          {!tier.show_whatsapp ? (
            <p className="mt-1 text-xs text-ink-faint">
              Available on Standard and Featured listings.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={business.email ?? ''}
            aria-invalid={state?.fieldErrors?.email ? true : undefined}
            className={fieldClass}
          />
          {state?.fieldErrors?.email ? (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.email}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium">
            Website
          </label>
          <input
            id="website"
            name="website"
            type="text"
            inputMode="url"
            defaultValue={business.website ?? ''}
            disabled={!tier.show_website_link}
            className={`${fieldClass} disabled:bg-paper-sunken disabled:text-ink-faint`}
          />
          {!tier.show_website_link ? (
            <p className="mt-1 text-xs text-ink-faint">
              Available on Standard and Featured listings.
            </p>
          ) : null}
        </div>
      </div>

      <SaveButton />
    </form>
  )
}
