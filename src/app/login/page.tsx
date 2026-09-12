import Link from 'next/link'

import { devAuthAllowed, isStubAuth } from '@/lib/auth'

/**
 * Sign-in.
 *
 * Real Supabase email/password and magic-link sign-in lands with the auth swap.
 * Until then this page explains the situation honestly and points at the
 * development role switcher rather than presenting a form that cannot work.
 */

export const metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  const stub = isStubAuth()

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Sign in</h1>

      {stub ? (
        <>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            No authentication backend is connected yet. Once a Supabase project is
            configured, business owners and editors will sign in here with an email
            address.
          </p>
          {devAuthAllowed() ? (
            <Link
              href="/dev/login"
              className="pressable tap-target mt-5 inline-flex items-center rounded-sm bg-green px-5 text-sm font-medium text-paper transition-colors hover:bg-green-deep"
            >
              Open the development role switcher
            </Link>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Sign-in is not yet available. Please contact{' '}
          <a
            href="mailto:hello@heartlandja.com"
            className="text-green underline underline-offset-2"
          >
            hello@heartlandja.com
          </a>
          .
        </p>
      )}

      <p className="mt-8 border-t border-rule pt-5 text-sm text-ink-muted">
        Want your business listed?{' '}
        <Link
          href="/advertise"
          className="text-green underline underline-offset-2 hover:text-green-light"
        >
          See listing options
        </Link>
      </p>
    </div>
  )
}
