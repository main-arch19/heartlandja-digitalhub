'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { submitListingEnquiry, type ActionResult } from '@/lib/data/mutations'
import type { BusinessCategory, ListingTier } from '@/types/db'

/**
 * Listing enquiry form.
 *
 * Progressively enhanced: it is a real <form> bound to a server action, so it
 * submits and works before React hydrates. `useActionState` only adds inline
 * validation messages and a pending state on top of that.
 */

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="tap-target inline-flex items-center rounded-sm bg-green px-6 text-sm font-medium text-paper transition-colors hover:bg-green-deep disabled:opacity-60"
    >
      {pending ? 'Sending…' : 'Send enquiry'}
    </button>
  )
}

const fieldClass =
  'tap-target mt-1 w-full rounded-sm border border-rule-strong bg-paper-raised px-3 py-2 text-[0.9375rem] text-ink focus:border-green focus:outline-none'

export function EnquiryForm({
  categories,
  tiers,
}: {
  categories: BusinessCategory[]
  tiers: ListingTier[]
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    submitListingEnquiry,
    null,
  )

  if (state?.ok) {
    return (
      <div
        role="status"
        className="rounded-sm border border-green/30 bg-green-wash p-6"
      >
        <h3 className="font-display text-lg font-semibold text-green-deep">
          Enquiry received
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.message ? (
        <p
          role="alert"
          className="rounded-sm border border-danger/30 bg-danger-wash px-4 py-3 text-sm text-ink"
        >
          {state.message}
        </p>
      ) : null}

      <Field
        label="Business name"
        name="name"
        required
        error={state?.fieldErrors?.name}
      />

      <Field label="Town or district" name="town" required error={state?.fieldErrors?.town} />

      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium">
          Category <Required />
        </label>
        <select id="categoryId" name="categoryId" required className={fieldClass}>
          <option value="">Choose a category…</option>
          {categories
            .filter((c) => c.parent_id !== null)
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
        <FieldError message={state?.fieldErrors?.categoryId} />
      </div>

      <div>
        <label htmlFor="tierSlug" className="block text-sm font-medium">
          Listing option <Required />
        </label>
        <select
          id="tierSlug"
          name="tierSlug"
          required
          defaultValue={tiers[0]?.slug}
          className={fieldClass}
        >
          {tiers.map((tier) => (
            <option key={tier.id} value={tier.slug}>
              {tier.name}
            </option>
          ))}
        </select>
      </div>

      <hr className="rule-gold !my-6" />

      <Field
        label="Your name"
        name="contactName"
        required
        error={state?.fieldErrors?.contactName}
      />
      <Field
        label="Phone number"
        name="phone"
        type="tel"
        required
        error={state?.fieldErrors?.phone}
      />
      <Field
        label="Email address"
        name="email"
        type="email"
        error={state?.fieldErrors?.email}
      />

      <div>
        <label htmlFor="message" className="block text-sm font-medium">
          Anything else we should know?
        </label>
        <textarea id="message" name="message" rows={4} className={fieldClass} />
      </div>

      {/* Honeypot. Hidden from people, filled by bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor="website_url">Leave this field empty</label>
        <input id="website_url" name="website_url" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <SubmitButton />

      <p className="text-xs leading-relaxed text-ink-faint">
        We use these details only to contact you about your listing.
      </p>
    </form>
  )
}

function Required() {
  return (
    <span className="text-danger" aria-hidden="true">
      *
    </span>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-danger">{message}</p>
}

function Field({
  label,
  name,
  type = 'text',
  required,
  error,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  error?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">
        {label} {required ? <Required /> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        aria-invalid={error ? true : undefined}
        className={fieldClass}
      />
      <FieldError message={error} />
    </div>
  )
}
