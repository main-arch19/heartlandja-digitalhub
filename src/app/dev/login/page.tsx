import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'

import {
  DEV_BUSINESS_COOKIE,
  DEV_ROLE_COOKIE,
  devAuthAllowed,
} from '@/lib/auth'
import { getAllActiveBusinesses } from '@/lib/data/directory'
import type { UserRole } from '@/types/db'

/**
 * Development role switcher.
 *
 * Exists ONLY so the admin and owner portals can be demonstrated before a
 * Supabase project is provisioned. `devAuthAllowed()` returns false in
 * production and whenever real Supabase auth is configured, and this route
 * 404s in that case — so it cannot become a back door.
 */

export const metadata = { robots: { index: false, follow: false } }

const ROLES: { role: UserRole; label: string; description: string }[] = [
  { role: 'admin', label: 'Administrator', description: 'Full access to editorial and directory admin.' },
  { role: 'editor', label: 'Editor', description: 'Publishes content; read-only on the directory.' },
  { role: 'contributor', label: 'Contributor', description: 'Writes and edits their own drafts only.' },
  { role: 'business_owner', label: 'Business owner', description: 'Sees only their own listing and its figures.' },
]

export default async function DevLoginPage() {
  if (!devAuthAllowed()) notFound()

  const businesses = await getAllActiveBusinesses()

  async function signIn(formData: FormData) {
    'use server'
    if (!devAuthAllowed()) notFound()

    const role = String(formData.get('role') ?? '')
    const businessId = String(formData.get('businessId') ?? '')

    const store = await cookies()
    store.set(DEV_ROLE_COOKIE, role, { httpOnly: true, sameSite: 'lax', path: '/' })

    if (role === 'business_owner' && businessId) {
      store.set(DEV_BUSINESS_COOKIE, businessId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    } else {
      store.delete(DEV_BUSINESS_COOKIE)
    }

    redirect(role === 'business_owner' ? '/business' : '/admin')
  }

  async function signOut() {
    'use server'
    const store = await cookies()
    store.delete(DEV_ROLE_COOKIE)
    store.delete(DEV_BUSINESS_COOKIE)
    redirect('/')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="eyebrow">Development only</p>
      <h1 className="mt-2 font-display text-2xl font-semibold">Sign in as a role</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        No authentication backend is connected. This page sets a role cookie so the
        admin and business portals can be demonstrated. It does not exist in
        production.
      </p>

      <div className="mt-8 space-y-3">
        {ROLES.map((entry) => (
          <form
            key={entry.role}
            action={signIn}
            className="rounded-sm border border-rule bg-paper-raised p-4"
          >
            <input type="hidden" name="role" value={entry.role} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{entry.label}</p>
                <p className="mt-0.5 text-xs text-ink-faint">{entry.description}</p>
              </div>
              <button
                type="submit"
                className="tap-target shrink-0 rounded-sm bg-green px-4 text-sm font-medium text-paper transition-colors hover:bg-green-deep"
              >
                Sign in
              </button>
            </div>

            {entry.role === 'business_owner' ? (
              <div className="mt-3 border-t border-rule pt-3">
                <label
                  htmlFor="dev-business"
                  className="block text-xs font-medium text-ink-muted"
                >
                  Sign in as the owner of
                </label>
                <select
                  id="dev-business"
                  name="businessId"
                  defaultValue={businesses[0]?.id}
                  className="tap-target mt-1.5 w-full rounded-sm border border-rule-strong bg-paper px-2 text-sm"
                >
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name} — {business.town}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </form>
        ))}
      </div>

      <form action={signOut} className="mt-6">
        <button
          type="submit"
          className="tap-target inline-flex items-center rounded-sm border border-rule-strong px-4 text-sm text-ink-muted transition-colors hover:border-danger hover:text-danger"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
