import Link from 'next/link'

/**
 * 403 page.
 *
 * Rendered when `forbidden()` is called — a signed-in user reaching something
 * their role does not cover. Deliberately distinct from the sign-in redirect:
 * telling someone who is already signed in to sign in again is confusing and
 * tells them nothing.
 */
export default function Forbidden() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <p className="eyebrow">403</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">
        You do not have access to this page
      </h1>
      <p className="mt-3 text-ink-muted">
        Your account is signed in, but this area is restricted to a different role.
        If you believe this is a mistake, contact{' '}
        <a
          href="mailto:hello@heartlandja.com"
          className="text-green underline underline-offset-2"
        >
          hello@heartlandja.com
        </a>
        .
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href="/"
          className="pressable tap-target inline-flex items-center rounded-sm bg-green px-5 text-sm font-medium text-paper transition-colors hover:bg-green-deep"
        >
          Back to the front page
        </Link>
        <Link
          href="/business"
          className="pressable tap-target inline-flex items-center rounded-sm border border-rule-strong px-5 text-sm font-medium text-ink transition-colors hover:border-green hover:text-green"
        >
          Your listing
        </Link>
      </div>
    </div>
  )
}
