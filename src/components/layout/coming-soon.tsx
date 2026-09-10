import Link from 'next/link'

/**
 * Placeholder for sections that arrive in later phases.
 *
 * These routes exist now because the masthead links to them and a 404 from the
 * primary navigation looks broken to a client being shown the work. Each is
 * marked `noindex` so an empty page never enters the search index and dilutes
 * the site's authority before it has any.
 */
export function ComingSoon({
  title,
  eyebrow,
  description,
  phase,
}: {
  title: string
  eyebrow: string
  description: string
  phase: string
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
        {title}
      </h1>
      <p className="standfirst mt-4">{description}</p>

      <hr className="rule-gold my-8" />

      <p className="text-sm text-ink-muted">
        This section is in development — {phase}.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/directory"
          className="tap-target inline-flex items-center rounded-sm bg-green px-5 text-sm font-medium text-paper transition-colors hover:bg-green-deep"
        >
          Browse the directory
        </Link>
        <Link
          href="/"
          className="tap-target inline-flex items-center rounded-sm border border-rule-strong px-5 text-sm font-medium text-ink transition-colors hover:border-green hover:text-green"
        >
          Back to the front page
        </Link>
      </div>
    </div>
  )
}

/** Shared metadata for placeholder routes — never indexed. */
export const comingSoonRobots = { index: false, follow: true } as const
