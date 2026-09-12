import Link from 'next/link'

import { MobileNav } from './mobile-nav'

/**
 * The masthead.
 *
 * Server-rendered. The only client JavaScript is the mobile menu toggle, which
 * is isolated in its own component so the rest of the header costs nothing.
 */

export const NAV_LINKS = [
  { href: '/news', label: 'News' },
  { href: '/topics', label: 'Topics' },
  { href: '/magazine', label: 'Magazine' },
  { href: '/history', label: 'History' },
  { href: '/directory', label: 'Directory' },
  { href: '/podcast', label: 'Podcast' },
  { href: '/live', label: 'Live' },
] as const

export function Masthead() {
  return (
    <header className="border-b border-rule bg-paper">
      {/* Top bar — wordmark and utility links */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-4 sm:py-5">
          <Link href="/" className="group inline-flex flex-col">
            <span className="font-display text-2xl font-semibold leading-none tracking-tight text-green sm:text-3xl">
              Heartland <span className="text-gold">JA</span>
            </span>
            <span className="mt-1 hidden text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint sm:block">
              The parish of Clarendon, documented
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/advertise"
              className="pressable tap-target hidden items-center rounded-sm border border-green px-4 text-sm font-medium text-green transition-colors hover:bg-green hover:text-paper sm:inline-flex"
            >
              Advertise
            </Link>
            <Link
              href="/search"
              aria-label="Search the site"
              className="pressable tap-target inline-flex items-center justify-center rounded-sm text-ink-muted transition-colors hover:text-green"
            >
              <SearchIcon />
            </Link>
            <MobileNav links={NAV_LINKS} />
          </div>
        </div>
      </div>

      {/* Primary navigation — desktop */}
      <nav
        aria-label="Primary"
        className="hidden border-t border-rule bg-paper-raised sm:block"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ul className="flex flex-wrap items-center gap-x-7 gap-y-1 py-2.5">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-ink-muted transition-colors hover:text-green"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}
