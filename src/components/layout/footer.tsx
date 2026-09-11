import Link from 'next/link'

import { SITE } from '@/lib/constants'

/**
 * Footer.
 *
 * Social presence is a link out, not an embedded feed. A third-party Instagram
 * widget would cost several hundred kilobytes and a render-blocking script on a
 * page budgeted at 500KB total, and it sends visitors away from the site. Links
 * cost nothing and point traffic the right direction.
 */

const FOOTER_SECTIONS = [
  {
    heading: 'Read',
    links: [
      { href: '/news', label: 'Parish News' },
      { href: '/magazine', label: 'The Magazine' },
      { href: '/history', label: 'Clarendon History' },
      { href: '/podcast', label: 'Podcast' },
      { href: '/live', label: 'Listen Live' },
    ],
  },
  {
    heading: 'Directory',
    links: [
      { href: '/directory', label: 'Browse Businesses' },
      { href: '/directory#towns', label: 'Browse by Town' },
      { href: '/advertise', label: 'List Your Business' },
      { href: '/business', label: 'Business Login' },
    ],
  },
  {
    heading: 'Heartland JA',
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/contact', label: 'Contact' },
      { href: '/advertise', label: 'Advertise' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
] as const

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-rule bg-paper-sunken">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Wordmark and social */}
          <div className="lg:col-span-1">
            <p className="font-display text-xl font-semibold text-green">
              Heartland <span className="text-gold">JA</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
              The magazine, news service and business directory for the parish of
              Clarendon, Jamaica.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <a
                href={SITE.social.instagram}
                target="_blank"
                rel="me noopener noreferrer"
                aria-label="Heartland JA on Instagram"
                className="tap-target inline-flex items-center justify-center rounded-sm border border-rule-strong text-ink-muted transition-colors hover:border-green hover:text-green"
              >
                <InstagramIcon />
              </a>
              <a
                href={SITE.social.facebook}
                target="_blank"
                rel="me noopener noreferrer"
                aria-label="Heartland JA on Facebook"
                className="tap-target inline-flex items-center justify-center rounded-sm border border-rule-strong text-ink-muted transition-colors hover:border-green hover:text-green"
              >
                <FacebookIcon />
              </a>
            </div>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.heading}>
              <h2 className="eyebrow">{section.heading}</h2>
              {/* Tight leading on desktop, finger-sized rows on mobile: the
                  footer is where people go for contact details on a phone. */}
              <ul className="mt-1 sm:mt-3">
                {section.links.map((link) => (
                  <li key={`${section.heading}-${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="link-target text-sm text-ink-muted transition-colors hover:text-green sm:min-h-0 sm:py-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="rule-gold my-8" />

        <div className="flex flex-col gap-2 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.publisher}. All rights reserved.
          </p>
          <p>
            Built by{' '}
            <span className="font-medium text-ink-muted">{SITE.builtBy}</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 8.5V7c0-.8.2-1.2 1.4-1.2H17V3h-2.5C11.6 3 11 4.5 11 6.6v1.9H9V11h2v10h3V11h2.3l.3-2.5H14Z" />
    </svg>
  )
}
